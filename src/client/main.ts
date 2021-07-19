import {
  establishConnection,
  establishPayerKeypair,
  checkProgram,
  writeFunc,
  readFunc,
} from './hello_world';
import { BigNumber } from "bignumber.js";

async function main() {
  console.log("\n----------------== main()");

  // Establish connection to the cluster
  await establishConnection();

  // Determine who pays for the fees
  await establishPayerKeypair();

  // Check if the program has been deployed
  await checkProgram();

  //await readFunc();

  const addr1 = 
  "9Ao3CgcFg3RB2p11Ay6FRo3YyTtUnrWC45V1Brbxg8cV";
// 4vxXyKhBVksxZXxCs8oNa3yHGeQWo9ZYA6Qa6H36gm3u
  const addr2 = "8Uyuz5PUS47GBoM4XUYLvCJe9XLJMyhsQeUXzFukDXG2";
  const addr3 = "CRURHng6s7DGRStUBS4fLtYiWkG9uzke7aLUdoTexyEq";
  const strArrayIn = [addr1, addr2, addr3];

  //--------------==
  const bn1 = new BigNumber('9007199254740991');
  //9.00719925474099118446744073709551615e+38  u64 max: 18446744073709551615
  const bn2 = new BigNumber('9007199254740992');
  const bn3 = new BigNumber('9007199254740993');//Number.MAX_SAFE_INTEGER
  const bnArrayIn: BigNumber[] = [bn1, bn2, bn3];

  //--------------==
  const boolArrayIn: boolean[] = [false, true, false];

  const isInitialized = true;
  const amount1 = 4294967295;
  const amount2 = '18446744073709551615';

  //await readFunc(strArrayIn, bnArrayIn, boolArrayIn, isInitialized, addr1, amount1, amount2);
  
  await writeFunc(strArrayIn, bnArrayIn, boolArrayIn, isInitialized, addr1, amount1, amount2);

  await readFunc(strArrayIn, bnArrayIn, boolArrayIn, isInitialized, addr1, amount1, amount2);

  console.log('End: Success!');
}

main().then(
  () => process.exit(),
  err => {
    console.error(err);
    process.exit(-1);
  },
);
