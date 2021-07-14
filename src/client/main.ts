/*
*/
import {
  establishConnection,
  establishPayerKeypair,
  checkProgram,
  writeFunc,
  readFunc,
} from './hello_world';

async function main() {
  console.log("\n----------------== main()");

  // Establish connection to the cluster
  await establishConnection();

  // Determine who pays for the fees
  await establishPayerKeypair();

  // Check if the program has been deployed
  await checkProgram();

  //await readFunc();

  const addr1 = "9Ao3CgcFg3RB2p11Ay6FRo3YyTtUnrWC45V1Brbxg8cV";
  const addr2 = "9ZNJrbfMy3QriVukW4mStRb5SKHu8ovDi4M7DWBeWtrx";
  const amount = 1234567893;
  const isEnabled = true;
  const addrs = [addr1, addr2];
  await writeFunc(addr1, addr2, amount, addrs, isEnabled);

  await readFunc();

  console.log('End: Success!');
}

main().then(
  () => process.exit(),
  err => {
    console.error(err);
    process.exit(-1);
  },
);
