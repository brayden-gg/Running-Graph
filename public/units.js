let units = {
    temperature: {
        TITLE: "Temperature",
        SYMBOL: "℉`",
        DISPLAY: val => val.toFixed(1) + " ℉",
        GENERATE: (_, weather) => weather.temperature,
    },
    apparentTemperature: {
        TITLE: "Apparent Temperature",
        SYMBOL: "℉`",
        DISPLAY: val => val.toFixed(1) + " ℉",
        GENERATE: (_, weather) => weather.apparentTemperature,
    },
    humidity: {
        TITLE: "Humidity",
        SYMBOL: "%",
        DISPLAY: val => (val * 100).toFixed(0) + "%",
        GENERATE: (_, weather) => weather.humidity,
    },
    date: {
        TITLE: "Date",
        SYMBOL: "M/D/YY",
        DISPLAY: val => {
            let d = new Date(val);
            return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear() % 2000}`;
        },
        GENERATE: run => new Date(run.start_date).valueOf(),
    },
    date_of_year: {
        TITLE: "Date of Year",
        SYMBOL: "M/D",
        DISPLAY: val => {
            let d = new Date(val);
            return `${d.getMonth() + 1}/${d.getDate()}`;
        },
        GENERATE: run => new Date(run.start_date).setYear(1970),
    },
    day_of_week: {
        TITLE: "Day of Week",
        SYMBOL: "M/D",
        DISPLAY: val => ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][val],
        GENERATE: run => (new Date(run.start_date).getDay() == 0 ? 6 : new Date(run.start_date).getDay() - 1),
    },
    windSpeed: {
        TITLE: "Wind Speed",
        SYMBOL: "mph",
        DISPLAY: val => val + "mph",
        GENERATE: (_, weather) => weather.windSpeed,
    },
    pace: {
        TITLE: "Pace",
        SYMBOL: "min/mi",
        DISPLAY: Time.stringify,
        GENERATE: run => {
            let total = 0;
            let len = 0;
            if (run.laps && run.workout_type == 3) {
                for (let s of run.laps) {
                    let pace = calcPace(s.distance, s.moving_time);
                    if (pace < SLOW) {
                        total += pace;
                        len++;
                    }
                }
                if (len != 0) {
                    return total / len;
                }
            }
            let pace = calcPace(run.distance, run.moving_time);
            return pace < new Time("30:00") ? pace.valueOf() : undefined;
        },
    },
    average_speed: {
        TITLE: "Speed",
        SYMBOL: "m/s",
        DISPLAY: val => val.toFixed(1),
        GENERATE: run => {
            let meters = 0;
            let seconds = 0;
            if (run.laps && run.workout_type == 3) {
                for (let s of run.laps) {
                    let pace = calcPace(s.distance, s.moving_time);
                    if (pace < SLOW) {
                        meters += s.distance;
                        seconds += s.moving_time;
                    }
                }
                if (seconds != 0) {
                    return meters / seconds;
                }
            }
            return run.average_speed;
        },
    },
    distance: {
        TITLE: "Distance",
        SYMBOL: "Miles",
        DISPLAY: val => val.toFixed(1) + " Mi",
        GENERATE: run => run.distance / 1609.34,
    },

    moving_time: {
        TITLE: "Moving Time",
        SYMBOL: "Seconds",
        DISPLAY: Time.stringify,
        GENERATE: run => run.moving_time,
    },
    elapsed_time: {
        TITLE: "Elapsed Time",
        SYMBOL: "Seconds",
        DISPLAY: Time.stringify,
        GENERATE: run => run.elapsed_time,
    },
    average_cadence: {
        TITLE: "Cadence",
        SYMBOL: "SPM",
        DISPLAY: val => val.toFixed(1) + " SPM",
        GENERATE: run => {
            let steps = 0;
            let time = 0;
            if (run.laps && run.workout_type == 3) {
                for (let s of run.laps) {
                    let pace = calcPace(s.distance, s.moving_time);
                    if (pace < SLOW) {
                        steps += s.average_cadence * s.moving_time;
                        time += s.moving_time;
                    }
                }
                if (time != 0) {
                    return (steps / time) * 2;
                }
            }
            return run.average_cadence * 2;
        },
    },
    total_elevation_gain: {
        TITLE: "Elevation Gain",
        SYMBOL: "ft",
        DISPLAY: val => val.toFixed(1) + "ft",
        GENERATE: (run, weather) => run.total_elevation_gain * 3.28083989501,
    },
    perceived_exertion: {
        TITLE: "Perceived Exertion",
        SYMBOL: "1-10",
        DISPLAY: val => val,
        GENERATE: run => run.perceived_exertion,
    },
    relative_effort: {
        TITLE: "Relative Effort",
        SYMBOL: "",
        DISPLAY: val => val,
        GENERATE: run => run.suffer_score,
    },
    calories: {
        TITLE: "Calories",
        SYMBOL: "Cal",
        DISPLAY: val => val,
        GENERATE: run => run.calories,
    },
    average_heartrate: {
        TITLE: "Average Heartrate",
        SYMBOL: "bpm",
        DISPLAY: val => val,
        GENERATE: run => run.average_heartrate,
    },
    best_efforts: {
        TITLE: "Best Efforts",
        DROP_DOWN: [""],
    },

    equivalent_times: {
        TITLE: "Equivalent Race Times",
    },

    flat_equivalent: {
        TITLE: "Equivalent Race Times (Flat)",
    },

    temp_equivalent: {
        TITLE: "Equivalent Race Times (at 60℉)",
    },

    flat_temp_equivalent: {
        TITLE: "Equivalent Race Times (Flat and at 60℉)",
    },

    toFlat: {
        TITLE: "Race Time (Flat)",
        SYMBOL: "Seconds",
        DISPLAY: Time.stringify,
        GENERATE: run => run?.race_analysis.toFlat,
    },

    to60: {
        TITLE: "Race Time at (at 60℉)",
        SYMBOL: "Seconds",
        DISPLAY: Time.stringify,
        GENERATE: run => run.race_analysis?.to60,
    },

    toFlat_and_to60: {
        TITLE: "Race Time (Flat and at 60℉)",
        SYMBOL: "Seconds",
        DISPLAY: Time.stringify,
        GENERATE: run => run?.race_analysis.toFlat_and_to60,
    },

    race_split_times: {
        TITLE: "Race Split Times",
        SYMBOL: "Seconds",
        DISPLAY: val => Time.stringify(val, 1),
        GENERATE: run => {
            if (run.workout_type !== 1) {
                return;
            }
            let matches = run.description.match(/(?<!\d)(?:\d{1,2}\:){1,2}\d{2}(?:\.\d+)?(?!\d)/g);
            if (matches && matches.length > 1) {
                matches = matches.map(e => Time.parse(e));
                let index = 0;

                return matches;
            }

            let laps = run.laps?.length > 2 ? run.laps : run.splits_standard?.length > 2 ? run.splits_standard : undefined;
            return laps?.filter(e => calcPace(e.distance, e.elapsed_time) < new Time("8:00") && e.elapsed_time < new Time("12:30")).map((_, i, a) => a.filter(e => e.split - 1 <= i).reduce((p, c) => p + c.elapsed_time, 0));
        },
        COLOR: data => {
            let point = data.dataset.data[data.dataIndex];
            return `rgba(${Math.min(point.y / predictTime(point.run), 1) * 255}, 28, 28, 0.6)`;
        },
    },

    workout_split_times: {
        TITLE: "Workout Splits",
        SYMBOL: "Seconds",
        DISPLAY: Time.stringify,
        GENERATE: run => {
            if (run.workout_type !== 3) {
                return;
            }
            let matches = run.description.match(/(?:\d{1,2}\:){1,2}\d{2}(?:\.\d+)?/g);
            if (run.name.match(/[1-4][05]0/)) {
                //distance is 100m-450m: allow time formats without colon separator
                let seconds = run.description.match(/(?<![\d.:])(?:\d{2})(?:\.\d+)?(?![\d.])/g);
                matches = matches && seconds ? matches.concat(seconds) : matches ?? seconds;
            }

            if (matches) {
                return matches.map(e => Time.parse(e)).filter(e => e < new Time("12:30"));
            }

            if (run?.laps?.length > 3) {
                return run.laps.filter(e => calcPace(e.distance, e.elapsed_time) < new Time("8:00") && e.elapsed_time < new Time("12:30")).map(e => e.elapsed_time);
            }
        },
    },

    workout_split_paces: {
        TITLE: "Workout Splits (Pace)",
        SYMBOL: "min/mi",
        DISPLAY: Time.stringify,
        GENERATE: run => (run.workout_type == 3 && run?.laps?.length > 3 ? run.laps.filter(e => calcPace(e.distance, e.elapsed_time) < new Time("8:00")).map(e => calcPace(e.distance, e.elapsed_time)) : undefined),
    },

    workout_split_distances: {
        TITLE: "Workout Splits (Distance)",
        SYMBOL: "m",
        DISPLAY: val => val + "m",
        GENERATE: run => (run.workout_type == 3 && run?.laps?.length > 3 ? run.laps.filter(e => calcPace(e.distance, e.elapsed_time) < new Time("8:00")).map(e => e.distance) : undefined),
    },

    avg_workout_split_time: {
        TITLE: "Average Workout Split",
        SYMBOL: "Seconds",
        DISPLAY: Time.stringify,
        GENERATE: run => {
            let splits = units.workout_split_times.GENERATE(run);
            if (splits?.length) {
                //not nullish or length 0
                return splits.reduce((p, c) => p + c, 0) / splits.length;
            }
        },
    },
    weekly_mileage: {
        TITLE: "Weekly Mileage",
        SYMBOL: "Miles",
        DISPLAY: val => val.toFixed(1) + " Mi",
        GENERATE: run => {
            const runDate = new Date(run.start_date);
            const millisPerDay = 1000 * 60 * 60 * 24;
            let dayOfWeek = runDate.getDay() == 0 ? 6 : runDate.getDay() - 1;
            const monday = new Date(runDate.valueOf() - millisPerDay * dayOfWeek);
            monday.setHours(0, 0, 0);
            const nextMonday = new Date(monday.valueOf() + millisPerDay * 7 - 1000);
            const runsThisWeek = data.strava.filter(e => new Date(e.start_date) >= monday && new Date(e.start_date) <= nextMonday);
            const totalDist = runsThisWeek.reduce((p, c) => (c.type == "Run" ? p + c.distance : p), 0);
            return totalDist / 1609.34;
        },
    },
    cumulative_weekly_mileage: {
        TITLE: "Cumulative Weekly Mileage",
        SYMBOL: "Miles",
        DISPLAY: val => val.toFixed(1) + " Mi",
        GENERATE: run => {
            const runDate = new Date(run.start_date);
            const millisPerDay = 1000 * 60 * 60 * 24;
            let dayOfWeek = runDate.getDay() == 0 ? 6 : runDate.getDay() - 1;
            const monday = new Date(runDate.valueOf() - millisPerDay * dayOfWeek);
            monday.setHours(0);
            monday.setMinutes(0);
            monday.setSeconds(0);
            const runsThisWeek = data.strava.filter(e => new Date(e.start_date) >= monday && new Date(e.start_date) <= runDate);
            const totalDist = runsThisWeek.reduce((p, c) => (c.type == "Run" ? p + c.distance : p), 0);
            return totalDist / 1609.34;
        },
    },
    rolling_weekly_mileage: {
        TITLE: "Rolling Weekly Mileage",
        SYMBOL: "Miles",
        DISPLAY: val => val.toFixed(1) + " Mi",
        GENERATE: run => {
            const runDate = new Date(run.start_date);
            const millisPerDay = 1000 * 60 * 60 * 24;
            const sevenDaysAgo = new Date(runDate.valueOf() - millisPerDay * 7);
            const runsThisWeek = data.strava.filter(e => new Date(e.start_date) >= sevenDaysAgo && new Date(e.start_date) <= runDate);
            const totalDist = runsThisWeek.reduce((p, c) => (c.type == "Run" ? p + c.distance : p), 0);
            return totalDist / 1609.34;
        },
    },
    cumulative_monthly_mileage: {
        TITLE: "Cumulative Monthly Mileage",
        SYMBOL: "Miles",
        DISPLAY: val => val.toFixed(1) + " Mi",
        GENERATE: run => {
            const runDate = new Date(run.start_date);
            const millisPerDay = 1000 * 60 * 60 * 24;
            const monthDay = new Date(runDate);
            monthDay.setDate(1);
            monthDay.setHours(0);
            monthDay.setMinutes(0);
            monthDay.setSeconds(0);
            const runsThisWeek = data.strava.filter(e => new Date(e.start_date) >= monthDay && new Date(e.start_date) <= runDate);
            const totalDist = runsThisWeek.reduce((p, c) => (c.type == "Run" ? p + c.distance : p), 0);
            return totalDist / 1609.34;
        },
    },
    cumulative_yearly_mileage: {
        TITLE: "Cumulative Yearly Mileage",
        SYMBOL: "Miles",
        DISPLAY: val => val.toFixed(1) + " Mi",
        GENERATE: run => {
            const runDate = new Date(run.start_date);
            const millisPerDay = 1000 * 60 * 60 * 24;
            const yearDay = new Date(runDate);
            yearDay.setMonth(0);
            yearDay.setDate(1);
            yearDay.setHours(0);
            yearDay.setMinutes(0);
            yearDay.setSeconds(0);
            const runsThisWeek = data.strava.filter(e => new Date(e.start_date) >= yearDay && new Date(e.start_date) <= runDate);
            const totalDist = runsThisWeek.reduce((p, c) => (c.type == "Run" ? p + c.distance : p), 0);
            return totalDist / 1609.34;
        },
    },
};

let modularAxes = {
    best_efforts: {
        add: params => {
            let d = params.bestEffort;
            units["best_efforts_" + d] = {
                TITLE: "Best Effort (" + d + ")",
                SYMBOL: "Seconds",
                DISPLAY: Time.stringify,
                GENERATE: run => run.best_efforts?.find(e.name == d)?.elapsed_time,
            };

            return d;
        },
        className: "hideBestEffort",
    },
    equivalent_times: {
        add: params => {
            let d = params.equivDist;
            units["equivalent_times_" + d] = {
                TITLE: "Equivalent Race Time: (" + d + ")",
                SYMBOL: "Seconds",
                DISPLAY: Time.stringify,
                GENERATE: run => run.race_analysis?.equivalent_times?.[d],
            };

            return d;
        },
        className: "hideEquivalentDistances",
    },
    flat_equivalent: {
        add: params => {
            let d = params.equivDist;
            units["flat_equivalent_" + d] = {
                TITLE: "Equivalent Race Time (Flat): (" + d + ")",
                SYMBOL: "Seconds",
                DISPLAY: Time.stringify,
                GENERATE: run => run.race_analysis?.flat_equivalent?.[d],
            };

            return d;
        },
        className: "hideEquivalentDistances",
    },
    temp_equivalent: {
        add: params => {
            let d = params.equivDist;
            units["temp_equivalent_" + d] = {
                TITLE: "Equivalent Race Time (at 60℉): (" + d + ")",
                SYMBOL: "Seconds",
                DISPLAY: Time.stringify,
                GENERATE: run => run.race_analysis?.temp_equivalent?.[d] ?? run.race_analysis?.equivalent_times?.[d],
            };

            return d;
        },
        className: "hideEquivalentDistances",
    },
    flat_temp_equivalent: {
        add: params => {
            let d = params.equivDist;
            units["flat_temp_equivalent_" + d] = {
                TITLE: "Equivalent Race Time (Flat and at 60℉): (" + d + ")",
                SYMBOL: "Seconds",
                DISPLAY: Time.stringify,
                GENERATE: run => run.race_analysis?.flat_temp_equivalent?.[d] ?? run.race_analysis?.equivalent_times?.[d],
            };

            return d;
        },
        className: "hideEquivalentDistances",
    },
};
