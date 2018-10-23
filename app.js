const { Client, PrivateKey } = require('dsteem');
const async = require('async');
const delay = require('delay');
const dotnev = require('dotenv');
const fs = require('fs');

dotnev.config();

const client = new Client('https://api.steemit.com');

const config = {
  STEEM_ACCOUNT: process.env.STEEM_ACCOUNT,
  POSTING_WIF: process.env.POSTING_WIF,
  LAST_PROCESSED: 'last_processed.json',
};

const log = (message) => {
  console.log(`${new Date().toString()} - ${message}`);
};

// Returns newer transactions after the last processed transactions
const getNewerTransactions = (trxs, id) => trxs.slice(trxs.findIndex(t => t.trx_id === id) + 1);

// Saving processed transaction ID and block
const saveProcessedTrx = async (block, trxId) => {
  fs.writeFileSync(config.LAST_PROCESSED, JSON.stringify({ block, trx_id: trxId }, null, 2));
};

// Resteems a steem post
const resteem = async (author, permlink) => {
  try {
    // Getting latest blog entries including resteems
    const blogs = await client.database.call('get_blog_entries', [config.STEEM_ACCOUNT, 999999, 20]);

    // Checking if already resteemed, if not continute to resteem
    if (!blogs.some(b => b.author === author && b.permlink === permlink)) {
      const jsonOp = JSON.stringify(['reblog', {
        account: config.STEEM_ACCOUNT,
        author,
        permlink,
      }]);

      const data = {
        id: 'follow',
        json: jsonOp,
        required_auths: [],
        required_posting_auths: [config.STEEM_ACCOUNT],
      };

      client.broadcast.json(data, PrivateKey.from(config.POSTING_WIF))
        .then(() => log(`Successfully resteemed: @${author}/${permlink}`));
    }
  } catch (e) {
    log(e.message);
  }
};

const startProcessing = async () => {
  try {
    // Loading last processed transaction id
    const lastTrx = JSON.parse(fs.readFileSync(config.LAST_PROCESSED));

    const history = await client.database.call('get_account_history', [config.STEEM_ACCOUNT, -1, 50]);

    // Getting only upvotes from account history
    const votes = history.filter(h => h[1].block >= lastTrx.block && h[1].op[0] === 'vote' && h[1].op[1].voter === config.STEEM_ACCOUNT && h[1].op[1].weight > 0);

    const data = votes.map((t) => {
      const trxId = t[1].trx_id;
      const { block } = t[1];
      const { author, permlink } = t[1].op[1];

      return {
        trx_id: trxId, block, author, permlink,
      };
    });

    const newerTransactions = getNewerTransactions(data, lastTrx.trx_id);

    // Processing each transaction in series
    async.forEachSeries(newerTransactions, async (trx) => {
      // Waiting 3 seconds for the next block
      await delay(3000).then(async () => {
        await resteem(trx.author, trx.permlink);
        await saveProcessedTrx(trx.block, trx.trx_id);
      });
    });
  } catch (e) {
    log(e.message);
  }
};

(async () => {
  startProcessing();

  // Running `startProcessing` function every 3 minutes
  setInterval(startProcessing, 3 * 60 * 1000);
})();
