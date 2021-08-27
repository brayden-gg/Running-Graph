document.getElementById("graph").width = window.outerWidth - 500;

const SLOW = new Time("12:00");

let points = [];

let data;
let graph;

//create dropdowns
let form = document.getElementById("form");

let activityType = new DropdownMenuElement({
    queryParamName: "activityType",
    title: "Activity Type",
    optionNames: ["Run", "Ride", "Workout", "Weight Training", "Handcycle", "Alpine Ski", "Rowing", "Walk"],
    optionValues: ["Run", "Ride", "Workout", "WeightTraining", "Handcycle", "AlpineSki", "Rowing", "Walk"],
    defaultValue: "Run",
});

form.appendChild(activityType.createElement());

let filterTextInc = new InputMenuElement({
    queryParamName: "filterInc",
    title: "Include",
    defaultValue: ".",
});

form.appendChild(filterTextInc.createElement());

let filterTextExc = new InputMenuElement({
    queryParamName: "filterExc",
    title: "Exclude",
    defaultValue: "a^",
});

form.appendChild(filterTextExc.createElement());

let allowedUnits = Object.keys(units).filter(e => units[e].supportedActivityTypes == "all" || units[e].supportedActivityTypes.includes(activityType.value));

let xAxis = new DropdownMenuElement({
    queryParamName: "x",
    title: "X-Axis",
    optionNames: allowedUnits.map(e => units[e].title),
    optionValues: allowedUnits,
    defaultValue: "date",
});

form.appendChild(xAxis.createElement());

if (modularAxes[xAxis.value]) {
    let xDropdown = new DropdownMenuElement({
        queryParamName: "xDropdown",
        ...modularAxes[xAxis.value],
    });
    form.appendChild(xDropdown.createElement());
    let distance = xDropdown.value;
    let newAxis = xAxis.value + "_" + distance;
    units[newAxis] = modularAxes[xAxis.value].getUnit(distance);
    xAxis.value = newAxis;
}

let yAxis = new DropdownMenuElement({
    queryParamName: "y",
    title: "Y-Axis",
    optionNames: allowedUnits.map(e => units[e].title),
    optionValues: allowedUnits,
    defaultValue: "pace",
});

form.appendChild(yAxis.createElement());

if (modularAxes[yAxis.value]) {
    let yDropdown = new DropdownMenuElement({
        queryParamName: "yDropdown",
        ...modularAxes[yAxis.value],
    });
    form.appendChild(yDropdown.createElement());
    let distance = yDropdown.value;
    let newAxis = yAxis.value + "_" + distance;
    units[newAxis] = modularAxes[yAxis.value].getUnit(distance);
    yAxis.value = newAxis;
}

let enableTrendLine = new CheckboxMenuElement({
    queryParamName: "trendLine",
    title: "Enable Trend Lines",
    defaultValue: "off",
});

form.appendChild(enableTrendLine.createElement());

let xLabel = `${units[xAxis.value].title} (${units[xAxis.value].symbol})`;
let yLabel = `${units[yAxis.value].title} (${units[yAxis.value].symbol})`;

(async () => {
    let configReq = await fetch("/config");
    let config = await configReq.json();
    let response = await fetch("/getData");
    let json = await response.json();

    data = {
        weather: json.weather,
        equiv: json.equiv,
        strava: json.strava.map((e, i) => ({ ...e, race_analysis: json.equiv[i] })),
    };

    console.log(data);

    makeChart(data);

    let updatedReq = await fetch("/update");
    let updatedJson = await updatedReq.json();

    if (updatedJson.errors) {
        window.location.replace(`https://www.strava.com/oauth/authorize?client_id=${config.client_id}&response_type=code&redirect_uri=http://localhost:3000/exchange_token.html${window.location.search}&approval_prompt=force&scope=activity:read_all`);
    }

    let addToAnalysis = [];

    console.log("updating race analysis");

    for (let i = 0; i < updatedJson.strava.length - data.equiv.length; i++) {
        //get race analysis for each new activity
        let analysis = {};
        if (updatedJson.strava[i].workout_type == 1) {
            let run = {
                ...updatedJson.strava[i],
                elapsed_time: predictTime(updatedJson.strava[i]),
                distance: predictDistance(updatedJson.strava[i]),
            };

            console.log(run);

            analysis.toFlat = (await getAdjustedHillsTime(run)).toFlat;
            analysis.equivalent_times = await getEquivalentTimes(run);
            analysis.to60 = await getAdjustedTempTime(run, updatedJson.weather[i]);

            analysis.toFlat_and_to60 = await getAdjustedTempTime({ ...run, elapsed_time: analysis.toFlat }, updatedJson.weather[i]);
            analysis.flat_equivalent = await getEquivalentTimes({ ...run, elapsed_time: analysis.toFlat });
            analysis.temp_equivalent = await getEquivalentTimes({ ...run, elapsed_time: analysis.to60 });
            analysis.flat_temp_equivalent = await getEquivalentTimes({ ...run, elapsed_time: analysis.toFlat_and_to60 });

            analysis.original = {
                distance: run.distance,
                elapsed_time: run.elapsed_time,
                name: run.name,
            };
        } else {
            analysis = {
                error: "Not a race",
            };
        }

        addToAnalysis.push(analysis);
    }
    console.log(addToAnalysis);

    let body = JSON.stringify({
        data: addToAnalysis,
        size: updatedJson.strava.length,
    });

    if (addToAnalysis.length > 0) {
        //add them to the json file
        await fetch("/updateRaceAnalysis", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body,
        });
    }
})();

function makeChart(data) {
    let stravaData = data.strava.filter(e => (e.name ? e.name.match(new RegExp(filterTextInc.value, "i")) != null && e.name.match(new RegExp(filterTextExc.value, "i")) == null : false));
    let weatherData = data.weather.filter((e, i) => (data.strava[i].name ? data.strava[i].name.match(new RegExp(filterTextInc.value, "i")) != null && data.strava[i].name.match(new RegExp(filterTextExc.value, "i")) == null : false));

    console.log(xAxis.value, yAxis.value);

    let labels = [];

    for (let i = 0; i < stravaData.length; i++) {
        const run = stravaData[i];
        const weather = weatherData[i];

        let xs = units[xAxis.value].generate(run, weather);
        let ys = units[yAxis.value].generate(run, weather);

        let category = run.workout_type || 10;

        xs = xs instanceof Array ? xs : [xs];
        ys = ys instanceof Array ? ys : [ys];

        for (let x of xs) {
            for (let y of ys) {
                if (x !== undefined && y !== undefined && run.type == activityType.value) {
                    if (!points[category]) {
                        points[category] = [];
                    }
                    points[category].push({ x, y, run, weather });
                    labels.push(run.name);
                }
            }
        }
    }

    let ctx = document.getElementById("graph").getContext("2d");

    let workoutTypes = [
        {
            name: activityType.value,
            color: "rgba(28, 200, 28, 0.4)",
            radius: activityType.value == "Run" ? 3 : 6,
            typeNumber: 10,
        },
        {
            name: "Long Run",
            color: "rgba(28, 28, 200, 0.45)",
            radius: 5,
            typeNumber: 2,
        },
        {
            name: "Workout",
            color: "rgba(200, 0, 200, 0.6)",
            radius: 6,
            typeNumber: 3,
        },
        {
            name: "Race",
            color: "rgba(255, 28, 28, 0.6)",
            radius: 8,
            typeNumber: 1,
        },

        // {
        //     name: "Also Ride?",
        //     color: "rgba(191, 239, 255, 0.6)", //"rgba(28, 200, 28, 0.4)", //
        //     radius: 5,
        //     typeNumber: 10,
        // },
        {
            name: "Workout",
            color: "rgba(200, 0, 200, 0.6)",
            radius: 7,
            typeNumber: 12,
        },
    ];

    let datasets = [];

    for (let type of workoutTypes) {
        if (points[type.typeNumber]) {
            datasets.push({
                label: type.name,
                data: points[type.typeNumber],
                backgroundColor: type.color,
                pointRadius: type.radius,
                pointHoverRadius: 7,
                trendlineLinear:
                    enableTrendLine.value == "on" && points[type.typeNumber].length > 1
                        ? {
                              style: type.color,
                              lineStyle: "solid",
                              width: 4,
                          }
                        : undefined,
            });
        }
    }

    graph = new Chart(ctx, {
        type: "scatter",

        data: {
            labels: labels,
            datasets,
        },
        options: {
            tooltips: {
                bodyFontSize: 15,
                callbacks: {
                    label: (tooltipItem, data) => {
                        let run = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index].run;
                        let xLabel = units[xAxis.value].display(tooltipItem.xLabel);
                        let yLabel = units[yAxis.value].display(tooltipItem.yLabel);

                        if (yAxis.value == "race_split_times") {
                            let sameRun = data.datasets[tooltipItem.datasetIndex].data.filter(e => e.run.id == run.id && e.y < tooltipItem.yLabel);
                            if (sameRun.length) {
                                let lastSplit = tooltipItem.yLabel - sameRun.reduce((p, c) => (c.y > p ? c.y : p), 0);
                                yLabel += " - " + Time.stringify(lastSplit, 1);
                            }
                        }

                        return `${run.name}: (${xLabel}, ${yLabel})`;
                    },
                },
            },
            scales: {
                xAxes: [
                    {
                        type: "linear",
                        position: "bottom",
                        scaleLabel: {
                            display: true,
                            labelString: xLabel,
                        },
                        ticks: {
                            callback: val => units[xAxis.value].display(val),
                            maxRotation: 0,
                            minRotation: 0,
                            autoskip: true,
                            // beginAtZero: true
                        },
                    },
                ],
                yAxes: [
                    {
                        scaleLabel: {
                            display: true,
                            labelString: yLabel,
                        },
                        ticks: {
                            callback: val => units[yAxis.value].display(val),
                        },
                    },
                ],
            },
            title: {
                display: true,
                text: `Visualizing ${activityType.value} Data: ${units[xAxis.value].title} vs. ${units[yAxis.value].title}`,
                fontSize: 60,
            },
            responsive: false,
            plugins: {
                zoom: {
                    pan: {
                        enabled: true,
                        mode: "x",
                        speed: 10,
                        threshold: 10,
                    },
                    zoom: {
                        enabled: true,
                        mode: "x",
                    },
                },
            },
        },
    });

    graph.options.plugins.zoom.pan.rangeMin = {
        x: graph.scales["x-axis-1"].min,
    };
    graph.options.plugins.zoom.pan.rangeMax = {
        x: graph.scales["x-axis-1"].max,
    };
    graph.options.plugins.zoom.zoom.rangeMin = {
        x: graph.scales["x-axis-1"].min,
    };
    graph.options.plugins.zoom.zoom.rangeMax = {
        x: graph.scales["x-axis-1"].max,
    };

    document.getElementById("graph").onclick = async function (evt) {
        let activePoint = graph.getElementAtEvent(evt);
        if (activePoint[0]) {
            let chartData = activePoint[0]._chart.config.data;
            let category = activePoint[0]._datasetIndex;
            let idx = activePoint[0]._index;

            let value = chartData.datasets[category].data[idx];

            console.log(value, activePoint[0]);

            let widget = document.getElementById("widget");

            let splits_tag = "";
            let dots = false;
            let splits = value.run.laps;
            if (splits && splits.length > 1) {
                if (value.run.splits_standard && splits.length <= 1) {
                    splits = value.run.splits_standard;
                }
                let show = splits.filter(e => {
                    let pace = calcPace(e.distance, e.moving_time);
                    return value.run.workout_type != 3 || pace < SLOW; //only dont't show it if it's a workout AND the pace is too slow
                });
                for (let i = 0; i < show.length; i++) {
                    let s = show[i];
                    let pace = calcPace(s.distance, s.moving_time);
                    if (value.weather.error || i < 5 || i > show.length - 6 || show.length < 11) {
                        splits_tag += `<p class = "run split"> ${value.run.workout_type != 3 && value.run.workout_type != 1 ? "Lap " + (i + 1) + " - " : ""}
                                    ${(s.distance / 1609.34).toFixed(1)} Mi - ${value.run.workout_type == 3 || value.run.workout_type == 1 ? " Time: " + units.elapsed_time.display(s.elapsed_time, 1) + " - " : ""}
                                    ${pace.toString()} min/mi</p>`;
                    } else if (!dots) {
                        splits_tag += `<p class = "run split"> ... </p>`;
                        dots = true;
                    }
                }
            }

            widget.innerHTML = `
                                <iframe height="${!value.weather.error ? 300 : 131}" width="390" frameborder='0' allowtransparency='true' scrolling='no'    style="float: left; margin: 0px; margin-right: 50px; border-radius: 10px" src='https://www.strava.com/activities/${value.run.id}/embed/${value.run.embed_token}'></iframe>
                                ${
                                    !value.weather.error
                                        ? `
                                <div style="border-bottom: 1px solid #666; height: 400px; background-color: rgba(255, 255, 255, 0);" >
                                        <div style="float: left; text-align: center; width: 133px;"> 
                                                <h1 class="run stat" >&nbsp;${value.weather.temperature.toFixed(0)}&deg; </h1>
                                                <p class="run " style="margin-top: 0px">Temperature</p>
                                        </div>
                                        <div style="float: left; text-align: center; width: 133px;"> 
                                                <h1 class="run stat">&nbsp;${value.weather.apparentTemperature.toFixed(0)}&deg; </h1>
                                                <p class="run " style="margin-top: 0px">Feels Like</p>
                                        </div>
                                        <div style= "float: left; text-align: center; width: 133px;"> 
                                                <h1 class="run stat">&nbsp;${(value.weather.humidity * 100).toFixed(0)}%</h1>
                                                <p class= "run" style="margin-top: 0px">Humidity</p>
                                        </div>
                                </div>
                                `
                                        : ""
                                }
                                <div id="not-analysis">
                                ${
                                    value.run.description
                                        ? `
                                <div style="float: left; width: ${!value.weather.error && splits_tag ? 200 : 400}px; text-align: center; margin-top: 10px">
                                        <p class="run split"><b>Description:</b></p>
                                        <p class="run split" style="margin-left: 10px; margin-right: 10px; text-align: center">${value.run.description.replace(/\n/g, "<br>")}</p>
                                </div>`
                                        : ""
                                }
                                ${
                                    splits_tag
                                        ? `
                                <div style="float: left; width: ${value.run.description && !value.weather.error ? 200 : 400}px; text-align: center; margin-top: 10px">
                                        <p class="run split"><b>Splits: </b></p>
                                        ${splits_tag}
                                </div>`
                                        : ""
                                }
                        </div>
                                ${
                                    value.run.workout_type == 1
                                        ? `
                                        <div id="race-analysis" style="float: left; width: 400px; text-align: center; margin-top: 10px; display: none;">
                                            <div style="float: left; width: 400px; text-align: center; margin-top: 0px;">
                                                <b>
                                                    <p class="run split" id="predicted-distance-time"></p>
                                                </b>
                                            </div>
                                            <div style="float: left; width: 200px; text-align: center; margin-top: 0px;">
                                                    <p class="run split"><b>Adjusted for Flat Course:</b></p>
                                                    <p id="flat-course" class="run split"></p>
                                                    <br>
                                                    <p class="run split"><b>Adjusted for Hilly Course:</b></p>
                                                    <p id="hilly-course" class="run split"></p>
                                                    <p class="run split"><input value="68" type="number" id="hills" style="width: 45px"></input>ft Elevation Gain</p>
                                                    
                                            </div>
                                            <div style="float: left; width: 200px; text-align: center; margin-top: 0px;">

                                                    <p class="run split"><b id="eqTimesTitle">Equivalent Times: </b></p>
                                                    <div id="equivalent-times"></div>
                                                    <button id="defaultEqButton">Default</button>
                                                    <button id="flatEqButton" style: "margin-left: 10px; margin-right: 10px">Flat</button>
                                                    <button id="hillsEqButton">Hills</button>
                                            </div>

                                        </div>
                                        <div id = "button-container"style="float: ${splits_tag ? "right" : "left"}; width: ${splits_tag ? "200" : "400"}px; text-align: center; margin-top: 5px;">
                                            <button id="analysis-toggle-button" style="display: block; margin: auto" onclick="toggleAnalysis()">View Race Analysis</button>
                                        </div>
                                        
                                `
                                        : ""
                                }
                                `;

            if (value.run.workout_type == 1) {
                let run = {
                    ...value.run,
                    elapsed_time: predictTime(value.run),
                    distance: predictDistance(value.run),
                };

                document.getElementById("predicted-distance-time").innerText = run.distance + "m: " + units.elapsed_time.display(run.elapsed_time, 2);

                setEquivalentTimes(run, "equivalent_times");

                let flatPara = document.getElementById("flat-course");
                let hillyPara = document.getElementById("hilly-course");
                let hillInput = document.getElementById("hills");
                let adjustedHills = await getAdjustedHillsTime(run, hillInput.value);

                flatPara.innerText = units.elapsed_time.display(adjustedHills.toFlat, 1);
                hillyPara.innerText = units.elapsed_time.display(adjustedHills.toHilly, 1);

                let defaultEqButton = document.getElementById("defaultEqButton");
                let flatEqButton = document.getElementById("flatEqButton");
                let hillsEqButton = document.getElementById("hillsEqButton");
                let hillsInput = document.getElementById("hills");

                if (hillsInput) {
                    defaultEqButton.onclick = () => setEquivalentTimes(run, "equivalent_times");
                    flatEqButton.onclick = () => setEquivalentTimes(run, "flat_equivalent");

                    hillsEqButton.onclick = async () => {
                        let hillyRun = await getEquivalentTimes({
                            distance: run.distance,
                            elapsed_time: adjustedHills.toHilly,
                        });
                        setEquivalentTimes(
                            {
                                race_analysis: {
                                    hills_equivalent: hillyRun,
                                },
                            },
                            "hills_equivalent"
                        );
                    };

                    hillsInput.onchange = () => recalculateHills(run);
                }
            }
        }
    };
}

function calcPace(meters, seconds) {
    let miles = meters / 1609.34;
    return new Time(seconds / miles);
}

function toggleAnalysis() {
    let hideElt = document.getElementById("not-analysis");
    let analysis = document.getElementById("race-analysis");
    let btn = document.getElementById("analysis-toggle-button");
    let btnDiv = document.getElementById("button-container");
    if (hideElt.style.display == "none") {
        hideElt.style.display = "";
        analysis.style.display = "none";
        btn.innerText = "View Race Analysis";
        btnDiv.style.float = "right";
    } else {
        hideElt.style.display = "none";
        analysis.style.display = "";
        btn.innerText = "Hide Race Analysis";
        btnDiv.style.float = "left";
        btnDiv.style.width = "400px";
    }
}

async function getEquivalentTimes(run) {
    if (!run.elapsed_time || !run.distance) {
        return;
    }

    let parser = new DOMParser();

    const res = await fetch(`/runCalc/distance=${units.distance.generate(run)}&time=0:${run.elapsed_time}&mode=eqperformance`);
    const txt = await res.text();

    let html = parser.parseFromString(txt, "text/html");
    let table = html.getElementsByTagName("table")[6].children[0].children;

    let results = {};

    for (let i = 2; i < 7; i++) {
        results[table[i].children[0].innerText] = Time.parse(table[i].children[1].innerText);
    }
    return results;
}

async function getAdjustedHillsTime(run, hypclimb) {
    let parser = new DOMParser();

    const res = await fetch(`/runCalc/mode=climbpace&climbing=${units.total_elevation_gain.generate(run)}&downhill=${units.total_elevation_gain.generate(run)}&distance=${units.distance.generate(run)}&time=0:${run.elapsed_time}&hypclimbing=${hypclimb}&hypdownhill=${hypclimb}`);
    const txt = await res.text();

    let html = parser.parseFromString(txt, "text/html");
    let toFlat = Time.parse(
        html
            .getElementsByClassName("gen")[0]
            .innerText.replace(/^(.*?):/, "")
            .trim()
    );
    let toHilly = Time.parse(
        html
            .getElementsByClassName("gen")[1]
            .innerText.replace(/^(.*?):/, "")
            .trim()
    );

    return { toFlat, toHilly };
}

async function getAdjustedTempTime(run, weather) {
    if (weather.error) {
        return run.elapsed_time;
    }

    let parser = new DOMParser();

    const res = await fetch(`/runCalc/distance=${units.distance.generate(run)}&time=0:${run.elapsed_time}&mode=to60&temp1=${weather.apparentTemperature}`);
    const txt = await res.text();

    let html = parser.parseFromString(txt, "text/html");
    return Time.parse(html.getElementsByClassName("row2")[1].innerText);
}

async function recalculateHills(run) {
    let hillyPara = document.getElementById("hilly-course");
    let hillInput = document.getElementById("hills");

    hillyPara.innerText = "Loading...";

    if (hillInput.value == undefined || hillInput.value <= 0) {
        hillyPara.innerText = "Enter a valid number";
        return;
    }

    let adjustedHills = await getAdjustedHillsTime(run, hillInput.value);
    hillyPara.innerText = units.elapsed_time.display(adjustedHills.toHilly, 1);

    let hillyRun = await getEquivalentTimes({ distance: run.distance, elapsed_time: adjustedHills.toHilly });
    setEquivalentTimes({ race_analysis: { hills_equivalent: hillyRun } }, "hills_equivalent");
}

function setEquivalentTimes(run, mode) {
    let eq = run.race_analysis[mode];
    let eqDiv = document.getElementById("equivalent-times");

    let title = document.getElementById("eqTimesTitle");

    switch (mode) {
        case "equivalent_times":
            title.innerText = "Equivalent Race Times";
            break;
        case "flat_equivalent":
            title.innerText = "Equivalent Race Times (Flat)";
            break;
        case "hills_equivalent":
            title.innerText = "Equivalent Race Times (Hills)";
            break;
    }

    let eqText = "";
    for (let t in eq) {
        eqText += `<p class="run split" style="width: 90px; float: left">${t}</p><p class="run split" style="width: 90px; float: left">${units.elapsed_time.display(eq[t], 1)}</p>`;
    }

    eqDiv.innerHTML = eqText;
}

async function recalculate(until) {
    await fetch("/delete/" + until);
    console.log("deleted");
    await fetch("/update");
    console.log("updated");
}

function predictDistance(run) {
    let nameMatches = commonEvents.map(event => event.names.filter(name => new RegExp(name, "i").exec(run.name)));
    let distanceError = commonEvents.map(event => Math.abs(event.distance - run.distance) / run.distance);

    const smallTolorance = 0.035;
    const bigTolorance = 0.06;

    let probabilities = [];

    for (let i = 0; i < commonEvents.length; i++) {
        let sum = 0;
        sum += nameMatches[i].length * 4;
        // sum += distanceError[i] == Math.min(...distanceError);
        sum += (distanceError[i] <= bigTolorance) * 1;
        sum += (distanceError[i] <= smallTolorance) * 3;
        sum -= distanceError[i] / 10;
        probabilities[i] = sum;
    }
    if (run.distance >= Math.max(...commonEvents.map(e => e.distance))) {
        return Math.max(...commonEvents.map(e => e.distance));
    }

    let highestIndex = probabilities.reduce((p, c, i, arr) => (c >= arr[p] ? i : p), 0);
    let sum = probabilities.reduce((p, c) => p + c);
    if (sum <= 1) {
        return run.distance;
    }

    return commonEvents[highestIndex].distance;
}

function predictDistance_workout(run, splitDistance) {
    let nameMatches = commonEvents.map(event => event.names.filter(name => new RegExp(name, "i").exec(run.name)));
    let distanceError = splitDistance ? commonEvents.map(event => Math.abs(event.distance - splitDistance) / splitDistance) : null;

    const smallTolorance = 0.035;
    const bigTolorance = 0.06;

    let probabilities = [];

    for (let i = 0; i < commonEvents.length; i++) {
        let sum = 0;
        sum += nameMatches[i].length * 4;
        // sum += distanceError[i] == Math.min(...distanceError);
        if (distanceError) {
            sum += (distanceError[i] <= bigTolorance) * 1;
            sum += (distanceError[i] <= smallTolorance) * 3;
            sum -= distanceError[i] / 10;
        }

        probabilities[i] = sum;
    }

    // console.log(probabilities)
    if (splitDistance >= Math.max(...commonEvents.map(e => e.distance))) {
        return Math.max(...commonEvents.map(e => e.distance));
    }

    let highestIndex = probabilities.reduce((p, c, i, arr) => (c >= arr[p] ? i : p), 0);
    let sum = probabilities.reduce((p, c) => p + c);
    if (sum <= 1) {
        return splitDistance;
    }

    return commonEvents[highestIndex].distance;
}

function predictTime(run) {
    let original = run.elapsed_time;
    let captured = run.description ? run.description.match(/(?:\d+\:){0,3}\d+(?:\.\d+)?/g) || [] : [];
    let best = Infinity;
    for (let c of captured) {
        let t = new Time(c);
        best = Math.abs(original - best) < Math.abs(original - t) ? best : t;
    }

    if (Math.abs((original - best) / best) < 0.15 && best != Infinity) {
        return best;
    }
    return original;
}

async function reloadAtIndex(index, id) {
    await fetch("/reloadAtIndex/" + index + "/" + id);
    console.log("Reloaded");
}

// function analyzeWorkout(run) {
//     //let nameMatches = commonEvents.map(event => event.names.filter(name => new RegExp(name, "i").exec(run.name)));

// }
