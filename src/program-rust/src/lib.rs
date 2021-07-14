use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    log::sol_log_compute_units,
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
};

/// Define the type of state stored in accounts
#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct DataStorage {
    pub addr1: String,
    pub addr2: String,
    pub addrs: Vec<String>,
    pub amount: u32,
    //pub is_enabled: bool,
}

entrypoint!(process_instruction);
/*needs this also in Cargo.toml:
[features]
no-entrypoint = [] //inside Cargo.toml
*/

// Program entrypoint's implementation
pub fn process_instruction(
    program_id: &Pubkey, // Public key of the account the program was loaded into
    accounts: &[AccountInfo], //accounts this program needs access to
    instruction_data: &[u8],  //byte array data that access parameters, _instruction_data will not be used
) -> ProgramResult {
    msg!("program entrypoint");

    // Iterating accounts is safer then indexing
    let accounts_iter = &mut accounts.iter();

    // Get the account to say hello to
    let account = next_account_info(accounts_iter)?;
    msg!("account.owner:{:?}", account.owner);
    // The account must be owned by the program in order to modify its data
    if account.owner != program_id {
        msg!("account.owner != program_id");
        return Err(ProgramError::IncorrectProgramId);
    }

    msg!("Start instruction decode");
    //passing instruction_data as binary instance of the data from the client side
    let mut data_storage = DataStorage::try_from_slice(instruction_data).map_err(|err| {
      msg!("data_storage decoding failed, {:?}", err);
      ProgramError::InvalidInstructionData
    })?;
    msg!("input data_storage: {:?}", data_storage);

    //take the same instance of data from the actual account we need to update, check if it is of the same size as the instruction data
    let data = &mut &mut account.data.borrow_mut();
    /*-----------== orinigal code
    let mut greeting_account = GreetingAccount::try_from_slice(&account.data.borrow())?;
    greeting_account.counter += 1;
    greeting_account.serialize(&mut &mut account.data.borrow_mut()[..])?;

    msg!("Greeted{} time(s)!", greeting_account.counter);
    */
    msg!("About to replace data with new instruction");
    //copy the argument data into the account data, data sizes have to match!
    // if(true){
      
    // }

    data[..instruction_data.len()].copy_from_slice(&instruction_data);

    sol_log_compute_units();
    msg!("data_storage.amount: {}", data_storage.amount);
    data_storage.amount += 1;
    msg!("data_storage.amount: {}", data_storage.amount);
    //---------------==original code
    /*let mut greeting_account = DataStorage::try_from_slice(&account.data.borrow())?;
    greeting_account.serialize(&mut &mut account.data.borrow_mut()[..])?;
    */

    Ok(())
}
/** to deploy
$ yarn run clean:program-rust
$ yarn run build:program-rust
"build:program-rust": "cargo build-bpf --manifest-path=./src/program-rust/Cargo.toml --bpf-out-dir=dist/program"

$ solana-test-validator --log   ... solnode
$ solana logs -u localhost      ... sollog

$ solana balance
$ solana airdrop 10
$ solana program deploy ./dist/program/helloworld.so
... Program Id: 
4vxXyKhBVksxZXxCs8oNa3yHGeQWo9ZYA6Qa6H36gm3u

./path-to-program/program.so
./path-to-program/program-keypair.json

To get information about a deployed program:
solana program show <program_id>

*/

// Sanity tests
#[cfg(test)]
mod test {
    use super::*;
    use solana_program::clock::Epoch;
    use std::mem;

    #[test]
    fn test_sanity() {
        let program_id = Pubkey::default();
        let key = Pubkey::default();
        let mut lamports = 0;
        let mut data = vec![0; mem::size_of::<u32>()];
        let owner = Pubkey::default();
        let account = AccountInfo::new(
            &key,
            false,
            true,
            &mut lamports,
            &mut data,
            &owner,
            false,
            Epoch::default(),
        );
        let instruction_data: Vec<u8> = Vec::new();

        let accounts = vec![account];

        assert_eq!(
            DataStorage::try_from_slice(&accounts[0].data.borrow())
                .unwrap()
                .counter,
            0
        );
        process_instruction(&program_id, &accounts, &instruction_data).unwrap();
        assert_eq!(
            DataStorage::try_from_slice(&accounts[0].data.borrow())
                .unwrap()
                .counter,
            1
        );
        process_instruction(&program_id, &accounts, &instruction_data).unwrap();
        assert_eq!(
            DataStorage::try_from_slice(&accounts[0].data.borrow())
                .unwrap()
                .counter,
            2
        );
    }
}
