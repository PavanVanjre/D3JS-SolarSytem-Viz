//Load data from TSV file asynchronously and render chart
d3.tsv("data/solarSystem.tsv").then((data) => {
  const planetsData = {};
  data.forEach((d) => {
    d.diameter = +d["Diameter (km)"];
    d.distance = +d["Distance (km)"];
    d.revolution = +d["Revolution (day)"];

    planetsData[d["Name"]] = {};
    planetsData[d["Name"]].diameter = +d["Diameter (km)"];
    planetsData[d["Name"]].distance = +d["Distance (km)"];
    planetsData[d["Name"]].revolution = +d["Revolution (day)"];
  });

  const tooltip = d3.select(".div-tooltip").append("p");

  const width = 950,
    height = 900;

  const svg = d3
    .select(".div-chart")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`);

  const plotG = svg.append("g").attr("id", "main-g");

  const planetDiameterScale = d3
    .scalePow()
    .exponent(0.35)
    .domain([0, d3.max(data, (d) => d.diameter)])
    .range([0, 30]);

  const orbitDistanceScale = d3
    .scalePow()
    .exponent(0.5)
    .domain(
      d3.extent(
        Object.keys(planetsData).map(
          (planetName) => planetsData[planetName].distance
        )
      )
    )
    .range([0, height / 2 - 30]);

  var planetColorScale = d3
    .scaleOrdinal()
    .domain(Object.keys(planetsData))
    .range(d3.schemeSet1);

  let orbitsGroup = plotG.append("g").attr("id", "orbits");

  orbitsGroup
    .selectAll("circle")
    .data(Object.keys(planetsData))
    .join("circle")
    .attr("cx", width / 2)
    .attr("cy", height / 2)
    .attr("r", (d) => orbitDistanceScale(planetsData[d].distance))
    .attr("fill", "none")
    .attr("stroke", "lightgray")
    .attr("stroke-width", 0.5);

  const planetG = plotG.append("g").attr("id", `planet-g`);

  let planetsGroup = planetG
    .selectAll(".planet")
    .data(Object.keys(planetsData))
    .join("g")
    .attr("id", (d) => d)
    .attr("class", "planet")
    .append("circle")
    .attr("cx", (d) => width / 2 + orbitDistanceScale(planetsData[d].distance))
    .attr("cy", height / 2)
    .attr("r", (d) => planetDiameterScale(planetsData[d].diameter))
    .attr("fill", (d) => planetColorScale(planetsData[d]))
    .on("mouseover", function (event, d) {
      // Show tooltip
      !isActive && tooltip.style("visibility", "visible");
      tooltip.html(
        `<p><h3>Planet : ${d}</h3> <b>Diameter: ${planetsData[d].diameter} km</b></p>`
      );
    })
    .on("mouseout", function () {
      // Hide tooltip
      !isActive && tooltip.style("visibility", "hidden");
    });

  let isActive = false; // this boolean variable indicates whether the solar system is playing the animation or not
  let speed = 1,
    idx = 0; // speed variable define rotation speed, idx define how big the angle for the rotation
  let timeInterval = 30; // the time interval for each animation which is set 30

  const playPauseButton = d3
    .select(".div-control")
    .append("input")
    .attr("type", "button")
    .attr("value", "Play")
    .attr("id", "play-pause-button")
    .attr("class", " play-button");

  //reset button to align planet postion to initial one
  const resetButton = d3
    .select(".div-control")
    .append("input")
    .attr("type", "button")
    .attr("value", "Reset")
    .attr("id", "reset-button")
    .attr("class", " play-button");

  d3.select(".div-control")
    .append("input")
    .attr("type", "range")
    .attr("id", "slider-speed")
    .attr("min", 0.1)
    .attr("max", 2)
    .attr("step", 0.01)
    .attr("value", speed);

  playPauseButton.on("click", function () {
    isActive = !isActive;
    d3.select(this).attr("value", isActive ? "Pause" : "Play");
    animation();
  });

  resetButton.on("click", function () {
    if (isActive) return; // only reset if it is paused
    planetG.selectAll(".planet").attr("transform", null);
  });
  
  d3.select("#slider-speed").on("input", function () {
    speed = +d3.select(this).property("value");
  });

  const revolutionScale = d3
    .scaleSymlog()
    .domain(
      d3.extent(
        data.filter((d) => d.Name != "Sun"),
        (d) => d.revolution
      )
    )
    .range([10, 1])
    .constant(1);

  function calculateScaledRevolution(planetName) {
    return revolutionScale(planetsData[planetName].revolution);
  }

  /* 
        This animation function to rotate the planets' position on the orbit
    */
  function animation() {
    if (!isActive) return;

    idx += 1;

    planetG.selectAll(".planet").attr("transform", (d) => {
      const planetName = d; // Assuming d is the planet name
      const rotationSpeed = calculateScaledRevolution(planetName);
      const rotationAngle = (rotationSpeed * idx * speed) % 360;
      // Translate to orbit distance then rotate
      return `rotate(${rotationAngle}, ${width / 2}, ${height / 2})`;
    });
  }

  setInterval(animation, timeInterval); // start the animation
});
