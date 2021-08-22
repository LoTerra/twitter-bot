require('dotenv').config()

var Terra = require("@terra-money/terra.js");
var Twitter = require('twitter');
var moment = require('moment');
var numeral = require('numeral');

var client = new Twitter({
    consumer_key: process.env.CONSUMER_KEY,
    consumer_secret: process.env.CONSUMER_SECRET,
    access_token_key: process.env.ACCESS_TOKEN_KEY,
    access_token_secret: process.env.ACCESS_TOKEN_SECRET
});

let tweetString = '';

const runBot = async () => {
    const terra = new Terra.LCDClient({
        URL: "https://lcd.terra.dev/",
        chainID: "columbus-4",
    });
    const api = new Terra.WasmAPI(terra.apiRequester);
    try {
        const contractConfigInfo = await api.contractQuery(
            process.env.loterra_contract_address, {
                config: {},
            }
        );
        console.log("ID: ", contractConfigInfo.lottery_counter)

        console.log("TIME: ", contractConfigInfo.block_time_play);

        //Calculate jackpot
        const bank = new Terra.BankAPI(terra.apiRequester);
        const contractBalance = await bank.balance(process.env.loterra_contract_address);
        const ustBalance = contractBalance.get('uusd').toData();
        const jackpotAlocation = contractConfigInfo.jackpot_percentage_reward;
        const contractJackpotInfo = (ustBalance.amount * jackpotAlocation) / 100;
        const jackpot = parseInt(contractJackpotInfo) / 1000000;

        console.log('JACKPOT:', numeral(jackpot).format("0,0.00"))

        const contractTicketsInfo = await api.contractQuery(
            process.env.loterra_contract_address, {
                count_ticket: {
                    lottery_id: contractConfigInfo.lottery_counter
                },
            }
        );
        console.log('Tickets: ', contractTicketsInfo)
        const contractPlayersInfo = await api.contractQuery(
            process.env.loterra_contract_address, {
                count_player: {
                    lottery_id: contractConfigInfo.lottery_counter
                },
            }
        );
        console.log('Players: ', contractPlayersInfo)

        var startDate = new Date();
        var endDate = new Date(contractConfigInfo.block_time_play);
        var diff = Date.parse(endDate) - Date.parse(startDate);
        var finalDate = new Date(diff)
        var days = finalDate.getDay();
        var hours = finalDate.getHours();
        var minutes = finalDate.getMinutes();
        var seconds = finalDate.getSeconds();

        console.log('Example tweet string: \n\n')
        //Create tweet string
        tweetString = 'Draw in ' + days + ':' + hours + ':' + minutes + ':' + seconds + '🎰\nIt has never been easier to win with just 5 out of 6 symbols \nWin ' +
            '1️⃣0️⃣0️⃣0️⃣0️⃣0️⃣ ' + ' $UST with only 1 $UST \n \nStats: \n🆔ID:' + contractConfigInfo.lottery_counter + '\n💰Jackpot:' + numeral(jackpot).format("0,0.00") + '$UST \n🎟️' + contractTicketsInfo + ' tickets sold \n👋' +
            contractPlayersInfo + ' players \n\n' + 'Desktop🖥️ \nLoterra.io \nMobile📱'
        //Dev purposes
        console.log(tweetString);
    } catch (e) {
        console.log(e);
    }


    //Create tweet data here

    client.post('statuses/update', {
        status: tweetString
    }, function (error, tweet, response) {
        if (!error) {
            console.log(tweet);
        } else {
            console.log(error)
        }
    })


}

//Run script every 60 min
setInterval(runBot, 3600000)
