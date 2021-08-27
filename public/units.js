let units = {
    temperature: {
        title: "Temperature",
        symbol: "℉`",
        display: val => val.toFixed(1) + " ℉",
        generate: (_, weather) => weather.temperature,
        supportedActivityTypes: ["Run", "Ride"],
    },
    apparentTemperature: {
        title: "Apparent Temperature",
        symbol: "℉`",
        display: val => val.toFixed(1) + " ℉",
        generate: (_, weather) => weather.apparentTemperature,
        supportedActivityTypes: ["Run", "Ride"],
    },
    humidity: {
        title: "Humidity",
        symbol: "%",
        display: val => (val * 100).toFixed(0) + "%",
        generate: (_, weather) => weather.humidity,
        supportedActivityTypes: ["Run", "Ride"],
    },
    date: {
        title: "Date",
        symbol: "M/D/YY",
        display: val => {
            let d = new Date(val);
            return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear() % 2000}`;
        },
        generate: run => new Date(run.start_date).valueOf(),
        supportedActivityTypes: "all",
    },
    date_of_year: {
        title: "Date of Year",
        symbol: "M/D",
        display: val => {
            let d = new Date(val);
            return `${d.getMonth() + 1}/${d.getDate()}`;
        },
        generate: run => new Date(run.start_date).setYear(1970),
        supportedActivityTypes: "all",
    },
    day_of_week: {
        title: "Day of Week",
        symbol: "M/D",
        display: val => ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][val],
        generate: run => (new Date(run.start_date).getDay() == 0 ? 6 : new Date(run.start_date).getDay() - 1),
        supportedActivityTypes: "all",
    },
    windSpeed: {
        title: "Wind Speed",
        symbol: "mph",
        display: val => val + "mph",
        generate: (_, weather) => weather.windSpeed,
        supportedActivityTypes: "all",
    },
    pace: {
        title: "Pace",
        symbol: "min/mi",
        display: Time.stringify,
        generate: run => {
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
        supportedActivityTypes: ["Run", "Ride"],
    },
    average_speed: {
        title: "Speed",
        symbol: "m/s",
        display: val => val.toFixed(1),
        generate: run => {
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
        supportedActivityTypes: ["Run", "Ride"],
    },
    distance: {
        title: "Distance",
        symbol: "Miles",
        display: val => val.toFixed(1) + " Mi",
        generate: run => run.distance / 1609.34,
        supportedActivityTypes: ["Run", "Ride"],
    },

    moving_time: {
        title: "Moving Time",
        symbol: "Seconds",
        display: Time.stringify,
        generate: run => run.moving_time,
        supportedActivityTypes: "all",
    },
    elapsed_time: {
        title: "Elapsed Time",
        symbol: "Seconds",
        display: Time.stringify,
        generate: run => run.elapsed_time,
        supportedActivityTypes: "all",
    },
    average_cadence: {
        title: "Cadence",
        symbol: "SPM",
        display: val => val.toFixed(1) + " SPM",
        generate: run => {
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
        supportedActivityTypes: ["Run"],
    },
    total_elevation_gain: {
        title: "Elevation Gain",
        symbol: "ft",
        display: val => val.toFixed(1) + "ft",
        generate: (run, weather) => run.total_elevation_gain * 3.28083989501,
        supportedActivityTypes: ["Run", "Ride"],
    },
    perceived_exertion: {
        title: "Perceived Exertion",
        symbol: "1-10",
        display: val => val,
        generate: run => run.perceived_exertion,
        supportedActivityTypes: "all",
    },
    relative_effort: {
        title: "Relative Effort",
        symbol: "",
        display: val => val,
        generate: run => run.suffer_score,
        supportedActivityTypes: "all",
    },
    calories: {
        title: "Calories",
        symbol: "Cal",
        display: val => val,
        generate: run => run.calories,
        supportedActivityTypes: "all",
    },
    average_heartrate: {
        title: "Average Heartrate",
        symbol: "bpm",
        display: val => val,
        generate: run => run.average_heartrate,
        supportedActivityTypes: "all",
    },
    best_efforts: {
        title: "Best Efforts",
        supportedActivityTypes: ["Run"],
    },

    equivalent_times: {
        title: "Equiv. Race Time",
        supportedActivityTypes: ["Run"],
    },

    flat_equivalent: {
        title: "Equiv. Race Time (Flat)",
        supportedActivityTypes: ["Run"],
    },

    temp_equivalent: {
        title: "Equiv. Race Time (60℉)",
        supportedActivityTypes: ["Run"],
    },

    flat_temp_equivalent: {
        title: "Equiv. Race Time (Flat/60℉)",
        supportedActivityTypes: ["Run"],
    },

    toFlat: {
        title: "Race Time (Flat)",
        symbol: "Seconds",
        display: Time.stringify,
        generate: run => run?.race_analysis.toFlat,
        supportedActivityTypes: ["Run"],
    },

    to60: {
        title: "Race Time at (60℉)",
        symbol: "Seconds",
        display: Time.stringify,
        generate: run => run.race_analysis?.to60,
        supportedActivityTypes: ["Run"],
    },

    toFlat_and_to60: {
        title: "Race Time (Flat/60℉)",
        symbol: "Seconds",
        display: Time.stringify,
        generate: run => run?.race_analysis.toFlat_and_to60,
        supportedActivityTypes: ["Run"],
    },

    race_split_times: {
        title: "Race Split Times",
        symbol: "Seconds",
        display: val => Time.stringify(val, 1),
        generate: run => {
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
        supportedActivityTypes: ["Run"],
    },

    workout_split_times: {
        title: "Workout Splits",
        symbol: "Seconds",
        display: Time.stringify,
        generate: run => {
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
        supportedActivityTypes: ["Run"],
    },

    workout_split_paces: {
        title: "Workout Splits (Pace)",
        symbol: "min/mi",
        display: Time.stringify,
        generate: run => (run.workout_type == 3 && run?.laps?.length > 3 ? run.laps.filter(e => calcPace(e.distance, e.elapsed_time) < new Time("8:00")).map(e => calcPace(e.distance, e.elapsed_time)) : undefined),
        supportedActivityTypes: ["Run"],
    },

    workout_split_distances: {
        title: "Workout Splits (Distance)",
        symbol: "m",
        display: val => val + "m",
        generate: run => (run.workout_type == 3 && run?.laps?.length > 3 ? run.laps.filter(e => calcPace(e.distance, e.elapsed_time) < new Time("8:00")).map(e => e.distance) : undefined),
        supportedActivityTypes: ["Run"],
    },

    avg_workout_split_time: {
        title: "Average Workout Split",
        symbol: "Seconds",
        display: Time.stringify,
        generate: run => {
            let splits = units.workout_split_times.generate(run);
            if (splits?.length) {
                //not nullish or length 0
                return splits.reduce((p, c) => p + c, 0) / splits.length;
            }
        },
        supportedActivityTypes: ["Run"],
    },
    weekly_mileage: {
        title: "Weekly Mileage",
        symbol: "Miles",
        display: val => val.toFixed(1) + " Mi",
        generate: run => {
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
        supportedActivityTypes: ["Run", "Ride"],
    },
    cumulative_weekly_mileage: {
        title: "Cumulative Weekly Mileage",
        symbol: "Miles",
        display: val => val.toFixed(1) + " Mi",
        generate: run => {
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
        supportedActivityTypes: ["Run", "Ride"],
    },
    rolling_weekly_mileage: {
        title: "Rolling Weekly Mileage",
        symbol: "Miles",
        display: val => val.toFixed(1) + " Mi",
        generate: run => {
            const runDate = new Date(run.start_date);
            const millisPerDay = 1000 * 60 * 60 * 24;
            const sevenDaysAgo = new Date(runDate.valueOf() - millisPerDay * 7);
            const runsThisWeek = data.strava.filter(e => new Date(e.start_date) >= sevenDaysAgo && new Date(e.start_date) <= runDate);
            const totalDist = runsThisWeek.reduce((p, c) => (c.type == "Run" ? p + c.distance : p), 0);
            return totalDist / 1609.34;
        },
        supportedActivityTypes: ["Run", "Ride"],
    },
    cumulative_monthly_mileage: {
        title: "Cumulative Monthly Mileage",
        symbol: "Miles",
        display: val => val.toFixed(1) + " Mi",
        generate: run => {
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
        supportedActivityTypes: ["Run", "Ride"],
    },
    cumulative_yearly_mileage: {
        title: "Cumulative Yearly Mileage",
        symbol: "Miles",
        display: val => val.toFixed(1) + " Mi",
        generate: run => {
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
        supportedActivityTypes: ["Run", "Ride"],
    },
    is_commute: {
        title: "Is Commute",
        symbol: "",
        display: val => val,
        generate: run => {
            return run.commute ? 1 : 0;
        },
        supportedActivityTypes: ["Ride"],
    },
};

let bestEffortDistances = ["400m", "1/2 mile", "1k", "1 mile", "2 mile", "5k", "10k", "15k", "10 mile", "20k", "half marathon", "30k", "marathon", "50k"];
let equivDistances = ["1500 m", "1 mile", "3000 m", "2 miles", "5k"];

let modularAxes = {
    best_efforts: {
        getUnit: dist => {
            return {
                title: "Best Effort (" + dist + ")",
                symbol: "Seconds",
                display: Time.stringify,
                generate: run => run.best_efforts?.find(e => e.name == dist)?.elapsed_time,
            };
        },
        title: "Distance",
        optionNames: bestEffortDistances,
        optionValues: bestEffortDistances,
        defaultValue: "400m",
    },
    equivalent_times: {
        getUnit: dist => {
            return {
                title: "Equiv. Race Time: (" + dist + ")",
                symbol: "Seconds",
                display: Time.stringify,
                generate: run => run.race_analysis?.equivalent_times?.[dist],
            };
        },
        title: "Distance",
        optionNames: equivDistances,
        optionValues: equivDistances,
        defaultValue: "1 mile",
    },
    flat_equivalent: {
        getUnit: dist => {
            return {
                title: "Equiv. Race Time (Flat): (" + dist + ")",
                symbol: "Seconds",
                display: Time.stringify,
                generate: run => run.race_analysis?.flat_equivalent?.[dist],
            };
        },
        title: "Distance",
        optionNames: equivDistances,
        optionValues: equivDistances,
        defaultValue: "1 mile",
    },
    temp_equivalent: {
        getUnit: dist => {
            return {
                title: "Equiv. Race Time (60℉): (" + dist + ")",
                symbol: "Seconds",
                display: Time.stringify,
                generate: run => run.race_analysis?.temp_equivalent?.[dist] ?? run.race_analysis?.equivalent_times?.[dist],
            };
        },
        title: "Distance",
        optionNames: equivDistances,
        optionValues: equivDistances,
        defaultValue: "1 mile",
    },
    flat_temp_equivalent: {
        getUnit: dist => {
            return {
                title: "Equiv. Race Time (Flat/60℉): (" + dist + ")",
                symbol: "Seconds",
                display: Time.stringify,
                generate: run => run.race_analysis?.flat_temp_equivalent?.[dist] ?? run.race_analysis?.equivalent_times?.[dist],
            };
        },

        title: "Distance",
        optionNames: equivDistances,
        optionValues: equivDistances,
        defaultValue: "1 mile",
    },
};
