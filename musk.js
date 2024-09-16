const fs = require('fs');
const path = require('path');
const axios = require('axios');
const readline = require('readline');
const { GetApiHash, GetHashByTime } = require('./muskgethash');

let apiHash = '';

class MuskEmpireAPI {
    headers(apiKey, apiTime, apiHash) {
        return {
            "Accept": "*/*",
            "Content-Type": "application/json",
            "Api-Key": apiKey,
            "Api-Hash": apiHash,
            "Api-Time": apiTime,
            "Origin": "https://game.muskempire.io",
            "Referer": "https://game.muskempire.io/",
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1"
        };
    }

    async auth(initData) {
        const url = "https://api.muskempire.io/telegram/auth";
        const chatInstanceMatch = initData.match(/chat_instance=([^&]*)/);
        const chatInstance = chatInstanceMatch ? chatInstanceMatch[1] : '';

        const payload = {
            data: {
                initData: initData,
                platform: "android",
                chatId: ""
            }
        };
        const myHeader = GetApiHash(initData);
        const temp = myHeader.headers;
        apiHash = temp['Api-Hash']
        const response = await axios.post(url, payload, { headers: myHeader.headers });
        return response.data;
    }

    async getUserData(apiKey) {
        const url = "https://api.muskempire.io/user/data/all";
        const payload = { data: {} };
        const [_time, _hash] = GetHashByTime(payload);
        const headers = this.headers(apiKey, _time, _hash);
        const response = await axios.post(url, payload, { headers });
        return response.data;
    }

    async claimDailyReward(apiKey, rewardId) {
        const url = "https://api.muskempire.io/quests/daily/claim";
        const payload = { data: rewardId };
        const [_time, _hash] = GetHashByTime(payload);
        const headers = this.headers(apiKey, _time, _hash);
        const response = await axios.post(url, payload, { headers });
        return response.data;
    }

    async getDB(apiKey) {
        const url = "https://api.muskempire.io/dbs";
        const payload = { data: { dbs: ["all"] } };
        const [_time, _hash] = GetHashByTime(payload);
        const headers = this.headers(apiKey, _time, _hash);
        const response = await axios.post(url, payload, { headers });
        return response.data;
    }

    async improveSkill(apiKey, skillKey) {
        const url = "https://api.muskempire.io/skills/improve";
        const payload = { data: skillKey };
        const [_time, _hash] = GetHashByTime(payload);
        const headers = this.headers(apiKey, _time, _hash);
        const response = await axios.post(url, payload, { headers });
        return response.data;
    }

    async guiTap(apiKey, amount, currentEnergy) {
        const url = "https://api.muskempire.io/hero/action/tap";
        const seconds = Math.floor(Math.random() * (900 - 500 + 1)) + 500;
        const payload = {
            data: {
                data: {
                    task: {
                        amount: amount,
                        currentEnergy: currentEnergy
                    }
                },
                seconds: seconds
            }
        };
        const [_time, _hash] = GetHashByTime(payload);
        const headers = this.headers(apiKey, _time, _hash);
        const response = await axios.post(url, payload, { headers });
        return response.data;
    }

    async pvpFight(apiKey, level, balance) {
        const url = "https://api.muskempire.io/pvp/fight";
        const strategies = ['aggressive', 'flexible', 'protective'];

        const strategy = strategies[Math.floor(Math.random() * strategies.length)];

        let league;

        if (level >= 13 && balance >= 100000000) {
            league = 'diamond';
        }
        else if (level >= 10 && balance >= 10000000) {
            league = 'platinum';
        }
        else if (level >= 8 && balance >= 1000000) {
            league = 'gold';
        }
        else if (level > 4 && balance >= 100000) {
            league = 'silver';
        }
        else if (level <= 4 && balance >= 10000) {
            league = 'bronze';
        }
        else {
            return "Tidak memenuhi syarat untuk berpartisipasi dalam turnamen mana pun.";
        }

        const payload = {
            data: {
                league: league,
                strategy: strategy
            }
        };

        const [_time, _hash] = GetHashByTime(payload);
        const headers = this.headers(apiKey, _time, _hash);
        const response = await axios.post(url, payload, { headers });
        return response.data;
    }

    async claimFightReward(apiKey) {
        const url = "https://api.muskempire.io/pvp/claim";
        const payload = { data: {} };
        const [_time, _hash] = GetHashByTime(payload);
        const headers = this.headers(apiKey, _time, _hash);
        const response = await axios.post(url, payload, { headers });
        return response.data;
    }

    askQuestion(query) {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        return new Promise(resolve => rl.question(query, ans => {
            rl.close();
            resolve(ans);
        }));
    }

    log(msg) {
        console.log(`[*] ${msg}`);
    }

    async waitWithCountdown(seconds) {
        for (let i = seconds; i >= 0; i--) {
            readline.cursorTo(process.stdout, 0);
            process.stdout.write(`===== Telah menyelesaikan semua akun, tunggu ${i} detik untuk melanjutkan siklus =====`);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        console.log('');
    }

    async main() {
        const dataFile = path.join(__dirname, 'data.txt');
        const initDataList = fs.readFileSync(dataFile, 'utf8')
            .replace(/\r/g, '')
            .split('\n')
            .filter(Boolean);

        console.log('Alat ini dibagikan secara gratis di saluran telegram Dân Cày Airdrop @dancayairdrop !');
        const upgradeSkills = await this.askQuestion('Apakah Anda ingin meningkatkan keterampilan? (y/n): ');
        const upgradeSkillsEnabled = upgradeSkills.toLowerCase() === 'y';
        const pvp = await this.askQuestion('Apakah Anda ingin bermain negosiasi? (y/n): ');
        const pvpEnabled = pvp.toLowerCase() === 'y';

        while (true) {
            for (let no = 0; no < initDataList.length; no++) {
                const initData = initDataList[no];
                try {
                    const authResponse = await this.auth(initData);
                    if (authResponse.success) {
                        const apiKey = initData.match(/hash=([^&]*)/)[1];

                        await this.processUserData(apiKey, no);
                        await this.processDailyRewards(apiKey);
                        await this.processGuiTap(apiKey);
                        if (pvpEnabled) {
                            await this.processPvP(apiKey);
                        }
                        if (upgradeSkillsEnabled) {
                            await this.processSkillUpgrade(apiKey);
                        }
                    } else {
                        console.log(`Gagal masuk untuk akun ${no + 1}!`);
                    }
                } catch (error) {
                    this.log(`Kesalahan saat memproses akun ${no + 1}: ${error.message}`);
                }
            }
            await this.waitWithCountdown(Math.floor(60));
        }
    }

    async processUserData(apiKey, accountNumber) {
        try {
            const userData = await this.getUserData(apiKey);
            const heroData = userData.data.hero;
            const firstName = userData.data.profile.firstName;
            const id = userData.data.profile.id;
            console.log(`========== Akun ${accountNumber + 1} | ${firstName} ==========`);
            this.log(`ID: ${id}`);
            this.log(`Saldo: ${heroData.money}`);
            this.log(`Keuntungan per jam: ${heroData.moneyPerHour}`);
            this.log(`Level: ${heroData.level}`);
            this.log(`EXP: ${heroData.exp}`);
            this.log(`Energi: ${heroData.earns.task.energy}`);
            this.log(`Kemenangan PvP: ${heroData.pvpWin}`);
            this.log(`Kekalahan PvP: ${heroData.pvpLose}`);
        } catch (error) {
            this.log(`Kesalahan saat mengambil data pengguna untuk akun ${accountNumber + 1}: ${error.message}`);
        }
    }

    async processDailyRewards(apiKey) {
        try {
            const userData = await this.getUserData(apiKey);
            const lastIndex = userData.data.hero.dailyRewardLastIndex;
            const nextRewardId = lastIndex + 1;
            try {
                const claimResponse = await this.claimDailyReward(apiKey, nextRewardId);
                if (claimResponse.success) {
                    this.log(`Pendaftaran sukses hari ${nextRewardId}`);
                } else {
                    this.log(`Pendaftaran gagal hari ${nextRewardId}`);
                }
            } catch (error) {
                this.log(`Kesalahan saat mendaftar hari ${nextRewardId}: ${error.message}`);
            }
    
        } catch (error) {
            this.log(`Kesalahan saat memproses hadiah harian: ${error.message}`);
        }
    }    

    async processGuiTap(apiKey) {
        try {
            const userData = await this.getUserData(apiKey);
            const energy = userData.data.hero.earns.task.energy;
            const actionResponse = await this.guiTap(apiKey, energy, 0);
            if (actionResponse.success) {
                this.log('Tap berhasil!');
                const heroData = actionResponse.data.hero;
                this.log(`Saldo: ${heroData.money}`);
            } else {
                this.log('Tap gagal!');
            }
        } catch (error) {
            this.log(`Kesalahan saat melakukan tap: ${error.message}`);
        }
    }

    async processSkillUpgrade(apiKey) {
        try {
            const dbSkillsResponse = await this.getDB(apiKey);
            if (dbSkillsResponse.success) {
                const userData = await this.getUserData(apiKey);
                let money = userData.data.hero.money;
                for (const skill of dbSkillsResponse.data.dbSkills) {
                    while (money > skill.priceBasic) {
                        try {
                            const improveResponse = await this.improveSkill(apiKey, skill.key);
                            if (improveResponse.success) {
                                this.log(`Peningkatan keterampilan ${skill.title} berhasil!`);
                                money = improveResponse.data.hero.money;
                            } else {
                                this.log(`Peningkatan keterampilan ${skill.title} gagal!`);
                                break;
                            }
                        } catch (error) {
                            this.log(`Kesalahan saat meningkatkan keterampilan ${skill.title}: ${error.message}`);
                            break;
                        }
                    }
                }
            }
        } catch (error) {
            this.log(`Kesalahan saat meningkatkan keterampilan: ${error.message}`);
        }
    }

    async processPvP(apiKey) {
        try {
            const userData = await this.getUserData(apiKey);
            const { level } = userData.data.hero;
            const money = userData.data.hero.money;
            const id = userData.data.profile.id;

            for (let i = 0; i < 5; i++) {
                try {
                    const fightResponse = await this.pvpFight(apiKey, level, money);
                    if (fightResponse.success) {
                        const fightData = fightResponse.data.fight;
                        this.log(`Memulai negosiasi ke-${i + 1}: Liga: ${fightData.league}, Strategi: ${fightData.player2Strategy}, Kontrak: ${fightData.moneyContract}, Keuntungan uang: ${fightData.moneyProfit}`);
                        if (fightData.winner === id) {
                            this.log('Menang! Meminta hadiah...');
                        } else {
                            this.log('Kalah!');
                        }
                        try {
                            const claimResponse = await this.claimFightReward(apiKey);
                            if (claimResponse.success) {
                                const claimData = claimResponse.data.fight;
                                const claimData2 = claimResponse.data.hero;
                                this.log(`Hadiah Dapat: Kontrak: ${claimData.moneyContract}, Keuntungan uang: ${claimData.moneyProfit}, Saldo: ${claimData2.money}`);
                            } else {
                                this.log('Klaim Gagal');
                            }
                        } catch (error) {
                            this.log(`Kesalahan saat meminta hadiah PvP: ${error.message}`);
                        }
                    } else {
                        this.log('Tidak memenuhi syarat untuk negosiasi apa pun!');
                    }
                } catch (error) {
                    this.log(`Kesalahan saat melakukan PvP ke-${i + 1}: ${error.message}`);
                }
            }
        } catch (error) {
            this.log(`Kesalahan saat melakukan PvP: ${error.message}`);
        }
    }
}

if (require.main === module) {
    const muskEmpireAPI = new MuskEmpireAPI();
    muskEmpireAPI.main().catch(err => {
        console.error(err);
        process.exit(1);
    });
}
