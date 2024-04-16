import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { IDL } from "../target/types/anchor";
import { ASSOCIATED_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  Connection,
  Commitment,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";

const privateKey = [
  82, 247, 200, 106, 74, 119, 140, 98, 199, 109, 171, 71, 72, 213, 247, 103,
  177, 47, 192, 114, 129, 136, 104, 240, 168, 239, 112, 195, 195, 149, 245, 130,
  182, 150, 38, 4, 144, 25, 13, 41, 87, 242, 76, 155, 13, 220, 185, 18, 234,
  137, 27, 45, 161, 88, 72, 244, 149, 243, 167, 204, 74, 151, 140, 207,
];
const adminWallet = anchor.web3.Keypair.fromSecretKey(
  Uint8Array.from(privateKey)
);

describe("extension_nft", () => {
  // devnet test
  const commitment: Commitment = "confirmed";
  const connection = new Connection(
    "https://holy-autumn-daylight.solana-devnet.quiknode.pro/f79aa971b5e5d9b72f0e1b55109dabed8d0b98a8/",
    {
      commitment,
      // wsEndpoint: "wss://api.devnet.solana.com/",
      confirmTransactionInitialTimeout: 60 * 10 * 1000,
    }
  );

  const options = anchor.AnchorProvider.defaultOptions();
  const wallet = new NodeWallet(adminWallet);
  const provider = new anchor.AnchorProvider(connection, wallet, options);

  anchor.setProvider(provider);

  const programId = new PublicKey(
    "4uQCwRedvUN48pcaC2dUs5nF5PdRkRHR3ZrNsrscSfVq" // contract address
    // "H31ofLpWqeAzF2Pg54HSPQGYifJad843tTJg8vCYVoh3" // contract address
    // "3RYspzrQVuFQVM8X2nizdHKncftaENduHyLzADkN7oag" // contract address
  ); // call this contract in this test script
  const program = new anchor.Program(IDL, programId, provider);

  // const provider = anchor.AnchorProvider.env();
  // anchor.setProvider(provider);
  // const program = anchor.workspace.ExtensionNft as Program<ExtensionNft>;
  const payer = provider.wallet as anchor.Wallet;

  it("Mint nft!", async () => {
    const balance = await anchor
      .getProvider()
      .connection.getBalance(payer.publicKey);

    console.log(payer.publicKey.toString(), " has ", balance);

    if (balance < 1e8) {
      console.log("Need to get airdrop sol");
      // const res = await anchor
      //   .getProvider()
      //   .connection.requestAirdrop(payer.publicKey, 1e9);
      // await anchor
      //   .getProvider()
      //   .connection.confirmTransaction(res, "confirmed");
    }

    let mint = new Keypair();
    console.log("Mint public key", mint.publicKey.toBase58());

    const destinationTokenAccount = getAssociatedTokenAddressSync(
      mint.publicKey,
      payer.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const nft_authority = await PublicKey.findProgramAddress(
      [Buffer.from("nft_authority")],
      program.programId
    );

    try {
      let tx = await program.methods
        .mintNft(
          "VIERBORI",
          "VIER",
          "https://arweave.net/MHK3Iopy0GgvDoM7LkkiAdg7pQqExuuWvedApCnzfj0"
        )
        .accounts({
          signer: payer.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
          tokenAccount: destinationTokenAccount,
          mint: mint.publicKey,
          nftAuthority: nft_authority[0],
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([mint])
        .rpc({ skipPreflight: true });

      console.log("Mint nft tx", tx);
      await anchor.getProvider().connection.confirmTransaction(tx, "confirmed");
    } catch (err) {
      console.log(err);
    }
  });
});
