# Solana Telegram Bot

This Telegram bot allows users to create Solana accounts, check their balance, send SOL to other users, and securely store their private keys using Shamir's Secret Sharing Scheme. The bot is built using TypeScript, Node.js, PostgreSQL, MongoDB, and the Solana Web3.js library.

## Features

- **Create Solana Accounts**: Users can generate a new Solana account through the bot.
- **Check Balance**: Users can check their SOL balance.
- **Send SOL**: Transfer SOL to other users by providing their public key and the amount.
- **Secure Key Management**: Private keys are split into shares using Shamir's Secret Sharing and encrypted before storing them in PostgreSQL and MongoDB.

## How It Works

### Private Key Management

1. **Private Key Generation**:

   - A Solana keypair is generated for each user.
   - The public key is stored for user identification and transactions.

2. **Shamir's Secret Sharing**:

   - The private key is split into 4 shares using Shamir's Secret Sharing with a threshold of 2 shares needed for reconstruction.

3. **Secure Storage**:

   - Two shares are encrypted using AES-256-CBC and stored in PostgreSQL.
   - The remaining two shares are encrypted and stored in MongoDB.

4. **Reconstruction**:
   - When a user performs a sensitive operation (e.g., sending SOL), the two shares from PostgreSQL and the two shares from MongoDB are decrypted and combined to reconstruct the private key.

### Sending SOL

- Users provide the recipient's public key and the amount of SOL to send.
- The bot retrieves and reconstructs the user's private key.
- The transaction is signed and sent to the Solana network.
- A confirmation message is sent to the user.

## Installation

### Prerequisites

1. **Node.js**: Install Node.js (v16+ recommended).
2. **PostgreSQL**: Set up a PostgreSQL database.
3. **MongoDB**: Set up a MongoDB database.
4. **Telegram Bot Token**: Obtain a bot token from [BotFather](https://core.telegram.org/bots#botfather).

### Setup

1. Clone the repository:

   ```
   git clone https://github.com/kamrancodex/solana-telegram-bot.git
   cd solana-telegram-bot
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following content:

   ```env
   TELEGRAM_BOT_TOKEN=<your-telegram-bot-token>
   ENCRYPTION_KEY=<your-encryption-key>
   IV=<your-initialization-vector>
   POSTGRES_HOST=localhost
   POSTGRES_PORT=5432
   POSTGRES_USER=<your-postgres-user>
   POSTGRES_PASSWORD=<your-postgres-password>
   POSTGRES_DB=<your-database-name>
   MONGO_URI=<your-mongodb-uri>
   ```

   - **Encryption Key and IV**: Generate these using:
     ```
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" # ENCRYPTION_KEY
     node -e "console.log(require('crypto').randomBytes(16).toString('hex'))" # IV
     ```

4. Compile the TypeScript code:

   ```
   npx tsc -b
   ```

5. Run the bot:

   ```
   node dist/index.js
   ```

## Usage

### Start the Bot

- Open Telegram and search for your bot.
- Start a conversation with `/start`.

### Commands

- **/start**: Create a new Solana account and see your public key.
- **Check Balance**: Get the current SOL balance of your account.
- **Send SOL**: Transfer SOL to another user by providing their public key and the amount.
- **Get Private Key**: Retrieve your private key securely (not recommended for regular users).

## Technologies Used

- **TypeScript**: For a strongly-typed development experience.
- **Node.js**: Server-side runtime.
- **PostgreSQL**: To store user data and partial private key shares.
- **MongoDB**: To store additional private key shares.
- **Solana Web3.js**: To interact with the Solana blockchain.
- **Telegram Bot API**: To build the Telegram bot.
- **Shamir's Secret Sharing**: For secure key management.
- **AES-256-CBC**: For encrypting private key shares.

## Project Structure

```
src
├── controller
│   └── apiController.ts
├── entities
│   └── User.ts
├── routes
│   └── routes.ts
├── services
│   ├── database.ts
│   ├── mongoService.ts
│   └── userService.ts
├── utils
│   └── cryptoUtils.ts
└── index.ts
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

Feel free to fork this repository and customize the bot for your needs. Contributions are welcome!
