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
import { BigNumber } from "bignumber.js";

import {
  getPayerKeypair,
  getRpcUrl,
  newKeypairWithLamports,
  getKeypairFromFile, log1, intToBool, boolToInt,
  strToUint8Array, bnToUint8Array, boolToUint8Array,
  u8ToStrArray, u8ToBnArray, u8ToBoolArray
} from './utils';

log1("\n----------== hello_world.ts");
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


log1("\n------------------== checkpoint 1");
const str_input1 = "4vxXyKhBVksxZXxCs8oNa3yHGeQWo9ZYA6Qa6H36gm3u";
const str_input2 = "4vxXyKhBVksxZXxCs8oNa3yHGeQWo9ZYA6Qa6H36gm3u";
const str_input3 = "4vxXyKhBVksxZXxCs8oNa3yHGeQWo9ZYA6Qa6H36gm3u";
const strArrayIn = [str_input1, str_input2, str_input3];

//--------------==
//Number.MAX_SAFE_INTEGER
const bn1 = new BigNumber('9007199254740990');
const bn2 = new BigNumber('9007199254740990');
const bn3 = new BigNumber('9007199254740990');
const bnArrayIn: BigNumber[] = [bn1, bn2, bn3];

//--------------==
const boolArrayIn: boolean[] = [true, false, true];

log1("\n------------== checkpoint 2");
const addr1 = "abcdefghijabcdefghijabcdefghijabcdefghijabcd";

/*Borsh schema
mapping client side to the deployed program Struct1
kind: program variable type ... struct or array or ...
fields: program variable fields name and its types
*/

log1("strArrayIn:", strArrayIn, "bnArrayIn:", bnArrayIn, "boolArrayIn:", boolArrayIn);


log1("\n------------------== strArrayIn");
const strU8Array = strToUint8Array(strArrayIn);
//log1('strU8Array:', typeof strU8Array, strU8Array);//strU8Array.join(', ')

log1("\n------------------== bnArrayIn");
const bnU8Array = bnToUint8Array(bnArrayIn);
//log1('bnU8Array:', typeof bnU8Array, bnU8Array);

log1("\n------------------== boolArrayIn");
const boolU8Array = boolToUint8Array(boolArrayIn);
//const boolArray2: boolean[] = boolNumArray.map(intToBool);

const dataLength1 = strU8Array.length;
const dataLength2 = bnU8Array.length;
const dataLength3 = boolU8Array.length;
log1("dataLength1:", dataLength1, "dataLength2:", dataLength2, "dataLength3:", dataLength3);

log1('\n------------------== Class definition');
/*
class ObjKeyToProperty {
  [index:string]:any;
  constructor(properties:{[index:string]:any}) {
      Object.keys(properties).map((key:string) => {
          this[key] = properties[key];
      });
  }
}
class Struct1 extends ObjKeyToProperty {
byteArray?:Uint8Array;
  constructor(
    properties:{[index:string]:any}) {
    super(properties);
  }
}
const Struct1Schema = new Map([
[Struct1, { 
    kind: 'struct', 
    fields: [
      //['strU8Array', [dataLength1]],
      //['bnU8Array', [dataLength2]],
      //['boolU8Array', [dataLength3]],
      //["isInitialized", "u8"],//boolMapper
      ['addr1', 'String'],
      //['amount1','u32'],
      //['amount2','u64'],
    ] 
}],
]);//'Unexpected 244 bytes after deserialized data'
/* class Struct1 {
  counter = 0;
  constructor(fields: {counter: number} | undefined = undefined) {
    if (fields) {
      this.counter = fields.counter;
    }
  }
}*/

const amount1 = 4294967295;
const amount2 = '18446744073709551615';
//const amountMaxJS = 9007199254740991;
const isInitialized = false;
const isInitialized_u8 = boolToInt(isInitialized);

//the borsh library requires meta data for mapping: all struct fields here inside constructor arguments
class Struct1 {
  addr1: string = '';
  //addr2: string = '';
  //addrs: string[] = [''];
  amount1: number = 0;
  amount2: string = '0';
  //is_enabled: boolean = false;

  constructor(fields: {
    addr1: string, 
    //addr2: string, 
    //addrs: string[], 
    amount1: number,
    amount2: string,
    //is_enabled: boolean,
  } | undefined = undefined) {
    if (fields) {
      this.addr1 = fields.addr1;
      //this.addr2 = fields.addr2;
      //this.addrs = fields.addrs;
      this.amount1 = fields.amount1;
      this.amount2 = fields.amount2;
      //this.is_enabled = fields.is_enabled;
    }
  }
}
const Struct1Schema = new Map([
  [Struct1, 
    {kind: 'struct', 
      fields: [
        ['addr1', 'String'], 
        //['addr2', 'String'], 
        //['addrs', 'Vec<String>'], 
        ['amount1','u32'],
        ['amount2','u64'],
        //['is_enabled','bool'],
      ]}],
]);
log1("\n------------== checkpoint 3");
const struct1:Struct1 = new Struct1({
    //strU8Array: strU8Array,
    //bnU8Array: bnU8Array,
    //boolU8Array: boolU8Array,
    //isInitialized: isInitialized_u8,
    addr1: addr1,
    amount1: amount1,
    amount2: amount2,
});
log1("struct1:", struct1);

log1("\n------------== checkpoint 4");
//borsh.serialize(schema: borsh.Schema, obj: any): Uint8Array or array of Bytes
const INPUT_SIZE = borsh.serialize(
  Struct1Schema, struct1).length;
log1('INPUT_SIZE:', INPUT_SIZE);



// Establish a connection to the cluster
export async function establishConnection(): Promise<void> {
  log1("\n------------== establishConnection()");
  const rpcUrl = await getRpcUrl();
  connection = new Connection(rpcUrl, 'confirmed');
  const version = await connection.getVersion();
  log1('Connection to cluster established:', rpcUrl, version);
}/**
pub fn establish_connection() -> Result<RpcClient> {
    let rpc_addr = "127.0.0.1:8899";
    let timeout = 1000;

    info!("connecting to solana node, RPC: {}, timeout: {}ms", rpc_addr, timeout);

    let rpc_addr: SocketAddr = rpc_addr.parse().expect("");

    let client = RpcClient::new_socket_with_timeout(rpc_addr, Duration::from_millis(timeout));

    let version = client.get_version()?;
    info!("RPC version: {:?}", version);
    Ok(client)
}*/


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
    // if using cli config keypair
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
to run: yarn run start
*/
export async function writeFunc(strArrayIn: string[], bnArrayIn: BigNumber[], boolArrayIn: boolean[], isInitialized: boolean, addr1: string, amount1: number, amount2: string): Promise<void> {
  log1('\n------------------==  writeFunc toPublicKey.toBase58():', toPublicKey.toBase58());

  //    Program log: data_storage decoding failed, Custom { kind: InvalidInput, error: "Unexpected length of input" }
  
  // const strU8Array = strToUint8Array(strArrayIn);
  // //log1('strU8Array:', typeof strU8Array, strU8Array);//strU8Array.join(', ')
  
  // log1("\n----------== bnArrayIn");
  // const bnU8Array = bnToUint8Array(bnArrayIn);
  // //log1('bnU8Array:', typeof bnU8Array, bnU8Array);
  
  // log1("\n----------== boolNumArray");
  // const boolU8Array = boolToUint8Array(boolArrayIn);
  // //const boolArray2: boolean[] = boolNumArray.map(intToBool);
  // log1("\n------------== checkpoint 1");
  // const isInitialized_u8 = boolToInt(isInitialized);

  log1("\n------------== make struct1");
  const struct1:Struct1 = new Struct1({
    //strU8Array: strU8Array,
    //bnU8Array: bnU8Array,
    //boolU8Array: boolU8Array,
    //isInitialized: isInitialized_u8,
    addr1: addr1,
    amount1: amount1,
    amount2: amount2,
  });
  log1("struct1:", struct1);
  // const dataLength1 = strU8Array.length;
  // const dataLength2 = bnU8Array.length;
  // const dataLength3 = boolU8Array.length;
  // log1("dataLength1:", dataLength1, "dataLength2:", dataLength2, "dataLength3:", dataLength3);

  log1("\n------------== about to serialize");
  const serialized = borsh.serialize(Struct1Schema, struct1);
  log1("\nserialized:", serialized, "\nserialized size:", serialized.length);

  let deserialized = borsh.deserialize(Struct1Schema, Struct1, Buffer.from(serialized));
  log1("\n-------------== deserialized:", deserialized);
  // log1("strU8Array out:", deserialized.strU8Array);
  // log1("bnU8Array out:", deserialized.bnU8Array);
  // log1("boolU8Array out:", deserialized.boolU8Array);

  log1("\n------------== TransactionInstruction");
  const instruction = new TransactionInstruction({
    keys: [{pubkey: toPublicKey, isSigner: false, isWritable: true}],
    programId: programPubkey,
    data: Buffer.from(serialized),//data: Buffer.alloc(0),//if sending no data
  });
  log1("\n------------== sendAndConfirmTransaction() ...");
  await sendAndConfirmTransaction(
    connection,
    new Transaction().add(instruction),
    [payerKeypair],
  );
  log1("end of writeFunc ...");
}

/**
 */
export async function readFunc(strArrayIn: string[], bnArrayIn: BigNumber[], boolArrayIn: boolean[], isInitialized: boolean, addr1: string, amount1: number, amount2: string): Promise<void> {
  log1("\n------------== readFunc()");
  const toAccountInfo = await connection.getAccountInfo(toPublicKey);
  if (toAccountInfo === null) {
    throw 'Error: cannot find toAccountInfo';
  }
  log1('got account info');
  /*convert from binary format: account type is GreetingAccount
  accountInfo.data: the data to be converted
  */
  const struct1: Struct1 = borsh.deserialize(
    Struct1Schema,
    Struct1,
    toAccountInfo.data,
  );
  /*BorshError: Unexpected 44 bytes after deserialized data => initial program values are zeros
 */
  log1('toAccountInfo:',
    toPublicKey.toBase58(),
    'retrieved data of struct1:', struct1);

  // const strArrayOut= u8ToStrArray(struct1.strU8Array);
  // log1("strArrayOut:", strArrayOut);
  // log1("strArrayIn:", strArrayIn);

  // const bnArrayOut2= u8ToBnArray(struct1.bnU8Array);
  // log1("bnArrayOut2:", bnArrayOut2);
  // log1("bnArrayIn:", bnArrayIn);

  // const boolArrayOut= u8ToBoolArray(struct1.boolU8Array);
  // log1("boolArrayOut:", boolArrayOut);
  // log1("boolArrayIn:", boolArrayIn);

  // log1("isInitialized in:", isInitialized);
  // log1("isInitialized out:", intToBool(struct1.isInitialized));

  log1("addr1 in :", addr1);
  log1("addr1 out:", struct1.addr1);

  log1("amount1 in :", amount1);
  log1("amount1 out:", struct1.amount1, struct1.amount1.toString());
  log1("amount2 in :", amount2);
  log1("amount2 out:", struct1.amount2, struct1.amount2.toString());
}
