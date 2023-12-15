const store = new Vuex.Store({
                state: {
                    shouldUpdate: false,
                },
                mutations: {
                    toggleUpdate(state) {
                        state.shouldUpdate = !state.shouldUpdate;
                    },
                },
            });

            new Vue({
                el: '#app',
                data: {
                    prayerTimes: {},
                    hicriDate: '',
                    miladiDate: '',
                    nextPrayerName: '',
                    nextPrayerTime: '',
                    weather: {
                        temp: null,
                        description: '',
                        icon: ''
                    },
                    currentDate: '',
                    currentTime: '',
                    timer: null,
                    dailyVerse: '',
                },
                methods: {
                    fetchPrayerTimes() {
                        axios.get('https://demo.xxxxxxx')
                            .then(response => {
                                const data = response.data.Namazvakitleri[0];
                                this.prayerTimes = {
                                    'İmsak': data.İmsak,
                                    'Güneş': data.Güneş,
                                    'Öğle': data.Öğle,
                                    'İkindi': data.İkindi,
                                    'Akşam': data.Akşam,
                                    'Yatsı': data.Yatsı
                                };
                                this.hicriDate = data.Hicri;
                                this.miladiDate = data.Tarih;
                                this.calculateNextPrayer();
                            })
                            .catch(error => {
                                console.error('Namaz vakitleri yüklenirken bir hata oluştu:', error);
                            });
                    },
                    fetchWeather() {
                        const apiKey = 'xxxxxxxxxxxxxxx';
                        const city = 'Herford,DE';
                        const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=tr`;
                        axios.get(url)
                            .then(response => {
                                this.weather.temp = Math.round(response.data.main.temp);
                                this.weather.description = response.data.weather[0].description;
                                this.weather.icon = `https://openweathermap.org/img/wn/${response.data.weather[0].icon}.png`;
                            })
                            .catch(error => {
                                console.error('Hava durumu bilgisi yüklenirken bir hata oluştu:', error);
                            });
                    },
                    fetchDailyVerse() {
                        axios.get('https://demo.xxxxxx')
                            .then(response => {
                                this.dailyVerse = response.data.ayet.gunun_ayeti;
                            })
                            .catch(error => {
                                console.error('Günün ayeti yüklenirken bir hata oluştu:', error);
                            });
                    },
                    calculateNextPrayer() {
                        const now = new Date();
                        let nextPrayerDiff = -1;
                        let nextPrayerNameTemp = '';

                        for (const [name, time] of Object.entries(this.prayerTimes)) {
                            const [hours, minutes] = time.split(':').map(Number);
                            if (isNaN(hours) || isNaN(minutes)) {
                                continue;
                            }
                            const prayerTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
                            const diff = prayerTime - now;
                            if (diff > 0 && (nextPrayerDiff === -1 || diff < nextPrayerDiff)) {
                                nextPrayerDiff = diff;
                                nextPrayerNameTemp = name;
                            }
                        }

                        if (nextPrayerDiff === -1) {
                            const imsakTime = this.prayerTimes['İmsak'].split(':').map(Number);
                            const tomorrow = new Date(now);
                            tomorrow.setDate(now.getDate() + 1);
                            const nextImsak = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), imsakTime[0], imsakTime[1]);
                            nextPrayerDiff = nextImsak - now;
                            nextPrayerNameTemp = 'İmsak';
                        }

                        this.nextPrayerName = nextPrayerNameTemp;
                        this.nextPrayerTime = this.secondsToHMS(nextPrayerDiff / 1000);
                        this.updateCountdown();
                    },
                    updateDateTime() {
                        const now = new Date();
                        const optionsDate = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                        const optionsTime = { hour: 'numeric', minute: 'numeric', second: 'numeric' };

                        this.currentDate = now.toLocaleDateString('tr-TR', optionsDate);
                        this.currentTime = now.toLocaleTimeString('tr-TR', optionsTime);
                    },
                    updateCountdown() {
                        if (this.timer) {
                            clearInterval(this.timer);
                        }
                        this.timer = setInterval(() => {
                            this.updateDateTime();
                            const hms = this.nextPrayerTime.split(':').map(Number);
                            let seconds = hms[0] * 3600 + hms[1] * 60 + hms[2] - 1;
                            this.nextPrayerTime = this.secondsToHMS(seconds);
                            if (seconds <= 0) {
                                clearInterval(this.timer);
                                this.fetchPrayerTimes();
                            }
                        }, 1000);
                    },
                    secondsToHMS(seconds) {
                        const hours = Math.floor(seconds / 3600);
                        const minutes = Math.floor((seconds % 3600) / 60);
                        const secs = Math.floor(seconds % 60);
                        return [hours, minutes, secs].map(v => v < 10 ? "0" + v : v).join(":");
                    },
                },
                watch: {
                    'store.state.shouldUpdate': function () {
                        this.fetchPrayerTimes();
                        this.fetchWeather();
                        this.fetchDailyVerse();
                    }
                },
                beforeDestroy() {
                    if (this.timer) {
                        clearInterval(this.timer);
                    }
                },
                mounted() {
                    this.fetchPrayerTimes();
                    this.fetchWeather();
                    this.fetchDailyVerse();
                    this.updateDateTime();
                    this.timer = setInterval(this.updateCountdown, 1000);

                    setInterval(() => {
                        store.commit('toggleUpdate');
                    }, 120000);
                },
            });
