var BubbleChart = {};

BubbleChart.create = function(el, properties, data) {
  var svg = d3.select(el).append('svg')
    .attr('class', 'd3')
    .attr('width', properties.width)
    .attr('height', properties.height);

  this.width = properties.width;
  this.height = properties.height;

  // Accessors
  accessors = {}
  accessors.x = function(d) { return d[properties.x]; }
  accessors.y = function(d) { return d[properties.y]; }
  accessors.radius = function(d) { return d[properties.radius]; }
  accessors.category = function(d) { return d[properties.category]; }

  this.margin = {top: 20, right: 20, bottom: 40, left: 40};

  this.update(svg, properties, accessors, data);
}

BubbleChart.update = function(svg, properties, accessors, data) {
  var scales = this._scales(accessors, data);
  this._draw(svg, properties, accessors, data, scales)
}

BubbleChart.w = function() {
  return this.width - this.margin.left - this.margin.right;
}

BubbleChart.h = function() {
  return this.height - this.margin.top - this.margin.bottom;
}

BubbleChart.transformG = function(){
  return "translate(" + this.margin.left + "," + this.margin.top + ")";
}

BubbleChart.transformX = function(){
  return "translate(0," + this.h() + ")";
}

BubbleChart._scales = function(a, data) {
  // Scales
  var xScale = d3.scale.linear().range([0, this.w()]);
  var yScale = d3.scale.linear().range([this.h(), 0]);
  var radiusScale = d3.scale.sqrt().range([0, 40])
  var colorScale = d3.scale.category10();

  // Domains
  radiusScale.domain([-1, d3.max(data, a.radius)]);

  xScale.domain(d3.extent(data, a.x));
  // Extend xScale to cover the largest and smallest bubble
  xScale.domain(
    [
      0,
      d3.max(data, a.x) + xScale.invert(radiusScale(d3.max(data, a.radius)))
    ]
  );

  // Extend the yScale to cover the largest bubble
  yScale.domain([0, d3.max(data, a.y)]);
  yScale.domain(
    [
      0,
      d3.max(data, a.y) + yScale.invert(this.h() - radiusScale(d3.max(data, a.radius)))
    ]
  );

  return {
    xScale: xScale,
    yScale: yScale,
    radiusScale: radiusScale,
    colorScale: colorScale
  }
}

BubbleChart._draw = function(svg, p, a, data, s) {
  // Defines a sort order so that the smallest dots are drawn on top.
  function order(one, two) { return a.radius(one) - a.radius(two); }

  // Positions the bubbles based on data.
  function position(bubble) {
    bubble .attr("cx", function(d) { return s.xScale(a.x(d)); })
           .attr("cy", function(d) { return s.yScale(a.y(d)); })
           .attr("r", function(d) { return s.radiusScale(a.radius(d)); });
  }

  var xLabel = p.x;
  var yLabel = p.y;
  var radiusLabel = p.radius;
  var categoryLabel = p.category;

  // Tooltips
  // TODO Make more agnostic.
  tip = d3.tip().attr('class', 'tooltip').html(function(d) {
    return categoryLabel + ": " + a.category(d) + "<br>" +
      radiusLabel + ": " + a.radius(d) + "<br>" +
      xLabel + ": " + a.x(d) + "<br>" +
      yLabel + ": " + a.y(d) + "<br>"
  });

  // Labels
  var xAxis = d3.svg.axis().orient("bottom").scale(s.xScale).ticks(12, d3.format(",d"));
  var yAxis = d3.svg.axis().scale(s.yScale).orient("left");

  svg = svg.append("g")
    .attr("transform", this.transformG());

  // Add the x-axis.
  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", this.transformX())
      .call(xAxis);
  // Add the y-axis.
  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis);
  // Add an x-axis label.
  svg.append("text")
      .attr("class", "x label")
      .attr("text-anchor", "end")
      .attr("x", this.w())
      .attr("y", this.h() - 6)
      .text(xLabel);
  // Add a y-axis label.
  svg.append("text")
      .attr("class", "y label")
      .attr("text-anchor", "end")
      .attr("y", 6)
      .attr("dy", ".75em")
      .attr("transform", "rotate(-90)")
      .text(yLabel);

  // Add a bubble per row.
  var bubble = svg.append("g")
      .attr("class", "bubbles")
    .selectAll(".bubble")
      .data(data)
    .enter().append("circle")
      .attr("class", "bubble")
      .style("fill", function(d) { return s.colorScale(a.category(d)); })
      .call(position)
      .sort(order)
      .call(tip)
      .on('mouseover', tip.show)
      .on('mouseout', tip.hide);

  // Add a title
  bubble.append("title")
    .text(function(d) { return a.category(d) });
}

BubbleChart.destroy = function(el) {
  // Any clean-up would go here
  // in this example there is nothing to do
};
