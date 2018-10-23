# AutoResteem
Auto resteems any post upvoted by a Steem account

This bot is built for resteeming any post upvoted by @antiabuse steem account. @antiabuse account auto upvotes verified Steem abuse figters as an extra incentive. Though built for @antiabuse, this can be used with any account.

### How to Use

- Clone the repository
- Make sure you have latest LTS or greater version of Node JS installed
- Go inside the cloned folder and command `npm install`
- Rename `.env.example` to `.env` and add your Steem username and posting WIF
- Edit `last_processed.json` and change latest `block` and `trx_id`
- Now command `npm start`

Block number and transaction ID can be found on https://steemd.com/@username. Click on the time link below the transaction and copy block number and transaction ID from the URL.

To run the bot continuously in background please use [PM2](https://pm2.io/). Generate `ecosystem.config.js` file with `pm2 init` command, add environment variables in the file.

When you are done start the bot with following command.

`pm2 start ecosystem.config.js --env production`

### Technologies
- Node JS
- dSteem

### Contributing

Feel free to fork the repo and make changes. If you have any suggestions or want to report bugs, please create an issue.
