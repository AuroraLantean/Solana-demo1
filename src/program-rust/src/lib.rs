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
use std::io::ErrorKind::InvalidData;

//------------------==
const DUMMY_ADDR1: &str = "abcdefghijabcdefghijabcdefghijabcdefghijabcd";
const DUMMY_AMOUNT1: u32 = 0;
const DUMMY_AMOUNT2: u64 = 0;
/// Define the type of state stored in accounts
#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct Struct1 {
    //pub strU8Array: Vec<u8>,
    //pub bnU8Array: Vec<u8>,
    //pub boolU8Array: Vec<u8>,
    //pub isInitialized: u8,
    pub addr1: String,
    pub amount1: u32,
    pub amount2: u64,
}
pub fn get_init_struct1() -> Struct1 {
  Struct1{ 
    //strU8Array: [0, 0, 0].to_vec(),
    //bnU8Array: [0, 0, 0].to_vec(),
    //boolU8Array: [0, 0, 0].to_vec(),
    //isInitialized: 0,
    addr1: String::from(DUMMY_ADDR1),
    amount1: DUMMY_AMOUNT1,
    amount2: DUMMY_AMOUNT2,
  }
}
/*pub fn get_init_struct1s() -> Vec<Struct1> {
  let mut messages = Vec::new();
  for _ in 0..20 {
      messages.push(get_init_struct1());
  }
  return messages;
}*/

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
    sol_log_compute_units();
    msg!("about to decode instruction data");
    //passing instruction_data as binary instance of the data from the client side
/*Use try_from_slice_unchecked to deserialize from buffers that are larger than the exact size of the serialized object. try_from_slice panics when the buffer is not exactly the right size.
*/

    let acct_data_decoded = match Struct1::try_from_slice(&account.data.borrow_mut()) {
        Ok(data) => data,//to be of type `Struct1`
        Err(err) => {
            if err.kind() == InvalidData {
                msg!("InvalidData so initializing account data");
                get_init_struct1()
            } else {
                panic!("Unknown error decoding account data {:?}", err)
            }
        }
    };
    msg!("acct_data_decoded: {:?}", acct_data_decoded);

    let instruction_data_decoded = Struct1::try_from_slice(instruction_data).map_err(|err| {
      msg!("instruction_data decoding failed,{:?}",err);
      ProgramError::InvalidInstructionData
    })?;
    msg!("instruction_data_decoded: {:?}", instruction_data_decoded);

    //take the same instance of data from the actual account we need to update, check if it is of the same size as the instruction data
    let data = &mut &mut account.data.borrow_mut();

    /*-----------== orinigal code
    let mut greeting_account = GreetingAccount::try_from_slice(&account.data.borrow())?;
    greeting_account.serialize(&mut &mut account.data.borrow_mut()[..])?;
    */

    //-------------------== Update Data
    msg!("about to update data.");
    //initial instruction_data.len() is zero
    data[..instruction_data.len()].copy_from_slice(&instruction_data);
    //data[..saved_data_encoded.len()].copy_from_slice(&saved_data_encoded); 
    sol_log_compute_units();
    //---------------==original code
    /*let mut greeting_account = Struct1::try_from_slice(&account.data.borrow())?;
    greeting_account.serialize(&mut &mut account.data.borrow_mut()[..])?;
    */
    let updated_data = Struct1::try_from_slice(data)?;
    msg!("updated_data: {:?}", updated_data);
    sol_log_compute_units();
    msg!("End program.");
    Ok(())
}
/** to deploy
$ yarn run clean:program-rust   ... solclean
$ yarn run build:program-rust   ... solbuild
"build:program-rust": "cargo build-bpf --manifest-path=./src/program-rust/Cargo.toml --bpf-out-dir=dist/program"

$ solana-test-validator --log   ... solnode
$ solana logs -u localhost      ... sollog

$ solana balance
$ solana airdrop 10
$ solana program deploy ./dist/program/helloworld.so
... Program Id: 
FSmbXWTKMfNG4yT2zEWXEHbLnCukbr7CxTAKwqmceas5

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
            Struct1::try_from_slice(&accounts[0].data.borrow())
                .unwrap()
                .counter,
            0
        );
        process_instruction(&program_id, &accounts, &instruction_data).unwrap();
        assert_eq!(
            Struct1::try_from_slice(&accounts[0].data.borrow())
                .unwrap()
                .counter,
            1
        );
        process_instruction(&program_id, &accounts, &instruction_data).unwrap();
        assert_eq!(
            Struct1::try_from_slice(&accounts[0].data.borrow())
                .unwrap()
                .counter,
            2
        );
    }
}
