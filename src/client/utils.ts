/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import os from 'os';
import fs from 'mz/fs';
import path from 'path';
import yaml from 'yaml';
import {Keypair, Connection} from '@solana/web3.js';
import { BigNumber } from "bignumber.js";

export const log1 = console.log;
// zzz
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function newKeypairWithLamports(
  connection: Connection,
  lamports = 1000000,
): Promise<Keypair> {
  const keypair = Keypair.generate();
  //const keypair = new Keypair();
  const signature = await connection.requestAirdrop(
    keypair.publicKey,
    lamports,
  );
  await connection.confirmTransaction(signature);
  return keypair;
}

/**
 * @private Path to Solana CLI config file
 */
async function getConfig(): Promise<any> {
  // Path to Solana CLI config file
  const CONFIG_FILE_PATH = path.resolve(
    os.homedir(),
    '.config',
    'solana',
    'cli',
    'config.yml',
  );
  const configYml = await fs.readFile(CONFIG_FILE_PATH, {encoding: 'utf8'});
  return yaml.parse(configYml);
}

/**
 * Load and parse the Solana CLI config file to determine which RPC url to use
 */
export async function getRpcUrl(): Promise<string> {
  try {
    const config = await getConfig();
    if (!config.json_rpc_url) throw new Error('Missing RPC URL');
    return config.json_rpc_url;
  } catch (err) {
    console.warn(
      'Failed to read RPC url from CLI config file, falling back to localhost',
    );
    return 'http://localhost:8899';
  }
}

/**
 * Load and parse the Solana CLI config file to determine which payer to use
 */
export async function getPayerKeypair(): Promise<Keypair> {
  try {
    const config = await getConfig();
    if (!config.keypair_path) throw new Error('Missing keypair path');
    return getKeypairFromFile(config.keypair_path);
  } catch (err) {
    console.warn(
      'Failed to read keypair from CLI config file, falling back to new random keypair',
    );
    return Keypair.generate();
    //return new Keypair();
  }
}

//make a Keypair from a secret key stored in file as bytes' array
export async function getKeypairFromFile(filePath: string): Promise<Keypair> {
  const secretKeyJSONString = await fs.readFile(filePath, {encoding: 'utf8'});
  const secretKeyByteArray = Uint8Array.from(JSON.parse(secretKeyJSONString));
  //const secretKey = Buffer.from(JSON.parse(secretKeyString));
  return Keypair.fromSecretKey(secretKeyByteArray);
}

const marker = "¶";
export const strToUint8Array = (strArray: string[]): Uint8Array => {
  let strUTF16Array: number[] = [];// only work for 0x00 ~ 0xff
  let code = 0, strCombined = "";
  for (let i = 0; i < strArray.length; ++i) {
    if(i === strArray.length - 1){
      strCombined = strCombined.concat(strArray[i]);//.padStart(21);
    } else {
      strCombined = strCombined.concat(strArray[i])+marker;//.padStart(21);
    }
  }
  log1("strCombined:", strCombined);

  for (let i = 0; i < strCombined.length; ++i) {
    code = strCombined.charCodeAt(i);//returns a number representing the UTF-16 code unit value, which is part of the greater Unicode number range
    strUTF16Array = strUTF16Array.concat([code]);
    //utf16Arrayv2 = utf16Arrayv2.concat([code & 0xff, code / 256 >>> 0]);
  }
  return new Uint8Array(strUTF16Array);//0~255 strUTF16Array
}

export const bnToUint8Array = (bnArray: BigNumber[]):Uint8Array => {
  let str = "", code = 0;
  let bnUTF16Array: number[] = []; 
  for (let i = 0; i < bnArray.length; ++i) {
    //str = bnArray[i].toString(16);
    if(i === bnArray.length - 1){
      str = bnArray[i].toString();//.padStart(21);
    } else {
      str = bnArray[i].toString()+marker;//.padStart(21);
    }
    log1("bnArray[i]:", bnArray[i], ", str:", str);
    code = 0;
    for (let i = 0; i < str.length; ++i) {
      code = str.charCodeAt(i);
      bnUTF16Array = bnUTF16Array.concat([code]);
      //bnUTF16Array.push(str);
    }
  }
  //bnUTF16Array.join(', ')
  //str = yourNumber.toString(16);
  //yourNumber = parseInt(str, 16);
  return new Uint8Array(bnUTF16Array);
}

//--------------==
export const intToBool = (n: number) => {
  if (n === 0) { return false } else {  return true  }
}
export const boolToInt = (b: boolean) => {
  if (b) { return 1  } else {  return 0  }
}
export const boolToUint8Array = (boolArray: boolean[]):Uint8Array => {
  const boolNumArray: number[]= boolArray.map(boolToInt);
  log1("boolNumArray:", boolNumArray);
  return new Uint8Array(boolNumArray);
}

//--------------== deserialize
export const u8ToStrArray = (u8StrArray: any):string[] => {
  let str = "", str_out1 = "";
  for (let i = 0; i < u8StrArray.length; ++i) {
    str= String.fromCharCode(u8StrArray[i]);
    log1("idx =", i, ":", str);
    str_out1 = str_out1.concat(str);
  }
  return str_out1.split(marker);
}

export const u8ToBnArray = ( u8BnArray: any):BigNumber[] => {
  let str = "", str_out2 = "";
  for (let i = 0; i < u8BnArray.length; ++i) {
    str = String.fromCharCode(u8BnArray[i]);//returns string
    log1("idx =", i, ":", str);
    str_out2 = str_out2.concat(str);
  }
  log1("str_out2:", str_out2);
  const str_out2b = str_out2.split(marker);
  let bnArrayOut2: BigNumber[] = []; 
  for (let i = 0; i < str_out2b.length; ++i) {
    log1("idx =", i, ":", str);
    bnArrayOut2.push(new BigNumber(str_out2b[i]));
  }
  return bnArrayOut2;
}

export const u8ToBoolArray = (u8BoolArray: any):boolean[] => {
  //const boolArrayOut: boolean[] = boolu8ArrayOut.map(intToBool);
  const boolArrayOut: boolean[] = [];
  for (let i = 0; i < u8BoolArray.length; ++i) {
    //log1("idx =", i, ":", u8BoolArray[i]);
    if(u8BoolArray[i] > 0){
      boolArrayOut.push(true);
    } else {
      boolArrayOut.push(false);
    }
  }
  return boolArrayOut;
}