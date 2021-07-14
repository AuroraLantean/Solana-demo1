/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import {
  Keypair,
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  SystemProgram,
  TransactionInstruction,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import fs from 'mz/fs';
import path from 'path';
import * as borsh from 'borsh';

import {
  getPayerKeypair,
  getRpcUrl,
  newKeypairWithLamports,
  getKeypairFromFile, log1
} from './utils';

log1("----------== hello_world.ts");
let connection: Connection;
let payerKeypair: Keypair;
let programPubkey: PublicKey;
let programId: string;
let toPublicKey: PublicKey;

const PROGRAM_PATH = path.resolve(__dirname, '../../dist/program');

/* Path to program shared object file which should be deployed on chain. This file is created when running:
  npm run build:program-rust
*/
const PROGRAM_SO_PATH = path.join(PROGRAM_PATH, 'helloworld.so');

/**
 * Path to the keypair of the deployed program.
 * This file is created when running `solana program deploy dist/program/helloworld.so`
 */
const PROGRAM_KEYPAIR_PATH = path.join(PROGRAM_PATH, 'helloworld-keypair.json');

/* dulicated from the program struct
class DataStorage {
  counter = 0;
  constructor(fields: {counter: number} | undefined = undefined) {
    if (fields) {
      this.counter = fields.counter;
    }
  }
}*/
log1("checkpoint 1");
class DataStorage {
  addr1: string = '';
  addr2: string = '';
  addrs: string[] = [''];
  amount: number = 0;
  //is_enabled: boolean = false;

  //the borsh library requires meta data for mapping: all struct fields here inside constructor arguments
  constructor(fields: {
    addr1: string, 
    addr2: string, 
    addrs: string[], 
    amount: number,
    //is_enabled: boolean,
  } | undefined = undefined) {
    if (fields) {
      this.addr1 = fields.addr1;
      this.addr2 = fields.addr2;
      this.addrs = fields.addrs;
      this.amount = fields.amount;
      //this.is_enabled = fields.is_enabled;
    }
  }
}
log1("checkpoint 2");

/*Borsh schema
mapping client side to the deployed program side of GreetingAccount
kind: program variable type ... struct or array or ...
fields: program variable fields name and its types

const DataStorageSchema = new Map([  [DataStorage, {kind: 'struct', fields: [['amount','u32']]}],
]);*/
const DataStorageSchema = new Map([
  [DataStorage, 
    {kind: 'struct', 
      fields: [
        ['addr1', 'String'], 
        ['addr2', 'String'], 
        ['addrs', 'Vec<String>'], 
        ['amount','u32'],
        //['is_enabled','bool'],
      ]}],
]);

log1("checkpoint 3");
const dataStorage = new DataStorage();
log1("dataStorage:", dataStorage);
const addr1 = "9Ao3CgcFg3RB2p11Ay6FRo3YyTtUnrWC45V1Brbxg8c_";
const addr2 = "9ZNJrbfMy3QriVukW4mStRb5SKHu8ovDi4M7DWBeWtr_";
const addrs = [addr1, addr2];
dataStorage.addr1 = addr1;
dataStorage.addr2 = addr2;
dataStorage.addrs = addrs;
dataStorage.amount = 1234567890;//9007199254740991
//dataStorage.is_enabled = false;
log1("dataStorage:", dataStorage);

log1("checkpoint 4");
//borsh.serialize(schema: borsh.Schema, obj: any): Uint8Array or array of Bytes
const INPUT_SIZE = borsh.serialize(
  DataStorageSchema, dataStorage).length;
log1('INPUT_SIZE:', INPUT_SIZE);



// Establish a connection to the cluster
export async function establishConnection(): Promise<void> {
  log1("------------== establishConnection()");
  const rpcUrl = await getRpcUrl();
  connection = new Connection(rpcUrl, 'confirmed');
  const version = await connection.getVersion();
  log1('Connection to cluster established:', rpcUrl, version);
}


// Establish payerKeypair
export async function establishPayerKeypair(): Promise<void> {
  log1("\n------------== establishPayerKeypair()");
  let fees = 0;
  if (!payerKeypair) {
    const {feeCalculator} = await connection.getRecentBlockhash();

    fees += await connection.getMinimumBalanceForRentExemption(INPUT_SIZE);

    // Calculate the cost of sending transactions
    fees += feeCalculator.lamportsPerSignature * 100; // wag

    try {
      // Get payer from cli config
      payerKeypair = await getPayerKeypair();
      log1("get payerKeypair via getPayerKeypair()");
    } catch (err) {
      log1("get payerKeypair via newKeypairWithLamports()");
      // Fund a new payer via airdrop
      payerKeypair = await newKeypairWithLamports(connection, fees);
    }
  }

  const lamports = await connection.getBalance(payerKeypair.publicKey);
  if (lamports < fees) {
    // This should only happen when using cli config keypair
    const sig = await connection.requestAirdrop(
      payerKeypair.publicKey,
      fees - lamports,
    );
    await connection.confirmTransaction(sig);
  }

  log1(
    'Using payer publicKey',
    payerKeypair.publicKey.toBase58(),
    'containing',
    lamports / LAMPORTS_PER_SOL,
    'SOL to pay for fees',
  );
}

// Check if the program has been deployed
export async function checkProgram(): Promise<void> {
  log1("\n------------== checkProgram()");
  // Read program id from keypair file
  try {
    const programKeypair = await getKeypairFromFile(PROGRAM_KEYPAIR_PATH);
    programPubkey = programKeypair.publicKey;
    log1("found programPubkey from programPubkey Keypair:", programPubkey);
  } catch (err) {
    const errMsg = (err as Error).message;
    throw new Error(
      `Failed to read program keypair at '${PROGRAM_KEYPAIR_PATH}' due to error: ${errMsg}. Program may need to be deployed with \`solana program deploy dist/program/helloworld.so\``,
    );
  }

  log1("\nCheck if the program has been deployed");
  const programAccountInfo = await connection.getAccountInfo(programPubkey);
  if (programAccountInfo === null) {
    if (fs.existsSync(PROGRAM_SO_PATH)) {
      throw new Error(
        'Program needs to be deployed with `solana program deploy dist/program/helloworld.so`',
      );
    } else {
      throw new Error('Program needs to be built and deployed');
    }
  } else if (!programAccountInfo.executable) {
    throw new Error(`Program is not executable`);
  }
  programId = programPubkey.toBase58();
  log1(`... program has been deployed \nUsing programId: ${programId}`);

  log1("\nDerive the toPublicKey"); 
  const SEED1 = 'hello';//for making a new accountInfo object
  toPublicKey = await PublicKey.createWithSeed(
    payerKeypair.publicKey,
    SEED1,
    programPubkey,
  );

  /*Use BPF loader, to load the program, to be read only and executable => the program account is fixed forever.

  Program as read only: only to receive Sol
  Must to mark the account as writable, before making the program modifications
  */
  log1("\nCheck if the toAccountInfo has data");
  const toAccountInfo = await connection.getAccountInfo(toPublicKey);
  if (toAccountInfo === null) {
    log1(
      'toAccountInfo is null... toPublicKey.toBase58():',
      toPublicKey.toBase58());
    const lamports = await connection.getMinimumBalanceForRentExemption(INPUT_SIZE);

    log1("lamports:", lamports);
    const transaction = new Transaction().add(
      SystemProgram.createAccountWithSeed({
        fromPubkey: payerKeypair.publicKey,
        basePubkey: payerKeypair.publicKey,
        seed: SEED1,
        newAccountPubkey: toPublicKey,
        lamports,//base lampport to keep this account exempted from rent
        space: INPUT_SIZE,//data size requesting on this account, fixed for now, MAKE SURE YOU HAVE THIS ENOUGH
        programId: programPubkey,
      }),
    );
    log1("transaction...");
    await sendAndConfirmTransaction(connection, transaction, [payerKeypair]);
  } else {
    log1("toAccountInfo has deployed data");
  }
}

/**
to run:
yarn run start
 */
export async function writeFunc(addr1: string, addr2: string, amount: number, addrs: string[], is_enabled: boolean): Promise<void> {
  log1('\n------------== writeFunc toPublicKey.toBase58():', toPublicKey.toBase58());
  const dataStorage = new DataStorage();
  dataStorage.addr1 = addr1;
  dataStorage.addr2 = addr2;
  dataStorage.addrs = addrs;
  dataStorage.amount = amount;
  //dataStorage.is_enabled = is_enabled;
  log1("dataStorage:", dataStorage);

  const instruction = new TransactionInstruction({
    keys: [{pubkey: toPublicKey, isSigner: false, isWritable: true}],
    programId: programPubkey,
    data: Buffer.from(
      borsh.serialize(
        DataStorageSchema, dataStorage
      )
    ),//data: Buffer.alloc(0),//if sending no data
  });
  log1("sendAndConfirmTransaction() ...");
  await sendAndConfirmTransaction(
    connection,
    new Transaction().add(instruction),
    [payerKeypair],
  );
  log1("end of writeFunc ...");
}

/**
 */
export async function readFunc(): Promise<void> {
  log1("\n------------== readFunc()");
  const toAccountInfo = await connection.getAccountInfo(toPublicKey);
  if (toAccountInfo === null) {
    throw 'Error: cannot find toAccountInfo';
  }

  /*convert from binary format: account type is GreetingAccount
  accountInfo.data: the data to be converted
  */
  const dataStorage: DataStorage = borsh.deserialize(
    DataStorageSchema,
    DataStorage,
    toAccountInfo.data,
  );
  log1('toAccountInfo:',
    toPublicKey.toBase58(),
    'retrieved data:'+
    '\naddr1:', dataStorage.addr1, 
    '\naddr2:', dataStorage.addr2, 
    '\naddrs:', dataStorage.addrs, 
    '\namount:', dataStorage.amount, 
    //'\nis_enabled:', dataStorage.is_enabled
  );
}
