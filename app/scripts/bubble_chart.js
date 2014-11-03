var BubbleChart = function() {};

BubbleChart.prototype.create = function(el, properties, data) {
  this.svg = d3.select(el).append('svg')
    .attr('class', 'd3')
    .attr('width', properties.width)
    .attr('height', properties.height);

  this.properties = properties;
  this.width = properties.width;
  this.height = properties.height;

  // Accessors
  this.x = function(d) { return d[properties.x]; }
  this.y = function(d) { return d[properties.y]; }
  this.radius = function(d) { return d[properties.radius]; }
  this.category = function(d) { return d[properties.category]; }

  this.margin = {top: 20, right: 20, bottom: 40, left: 40};

  this.data = data;
  this._scales();
  this._setup();
  this.update();
  return this;
}

BubbleChart.prototype.update = function() {
  this._updateDomains();
  this._draw();
}

BubbleChart.prototype.w = function() {
  return this.width - this.margin.left - this.margin.right;
}

BubbleChart.prototype.h = function() {
  return this.height - this.margin.top - this.margin.bottom;
}

BubbleChart.prototype.transformG = function(){
  return "translate(" + this.margin.left + "," + this.margin.top + ")";
}

BubbleChart.prototype.transformX = function(){
  return "translate(0," + this.h() + ")";
}

BubbleChart.prototype._updateAxis = function () {
}

BubbleChart.prototype._setup  = function () {
  var xLabel = this.properties.x;
  var yLabel = this.properties.y;
  var radiusLabel = this.properties.radius;
  var categoryLabel = this.properties.category;

  // Labels
  this.xAxis = d3.svg.axis().orient("bottom").scale(this.xScale).ticks(12, d3.format(",d"));
  this.yAxis = d3.svg.axis().scale(this.yScale).orient("left");

  svg = this.svg.append("g")
    .attr("transform", this.transformG());

  // Add the x-axis.
  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", this.transformX())
      .call(this.xAxis);

  // Add the y-axis.
  svg.append("g")
      .attr("class", "y axis")
      .call(this.yAxis);

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

  this.bubbles = this.svg.append("g")
    .attr("class", "bubbles");
}

BubbleChart.prototype._updateDomains = function () {
  // Domains
  this.radiusScale.domain([-1, d3.max(this.data, this.radius)]);

  this.xScale.domain(d3.extent(this.data, this.x));
  // Extend xScale to cover the largest and smallest bubble
  this.xScale.domain(
    [
      0,
      d3.max(this.data, this.x) +
        this.xScale.invert(this.radiusScale(d3.max(this.data, this.radius)))
    ]
  );

  // Extend the yScale to cover the largest bubble
  this.yScale.domain([0, d3.max(this.data, this.y)]);
  this.yScale.domain(
    [
      0,
      d3.max(this.data, this.y) + this.yScale.invert(this.h() -
        this.radiusScale(d3.max(this.data, this.radius)))
    ]
  );

  this.svg.select('.x.axis').transition().call(this.xAxis);
  this.svg.select('.y.axis').transition().call(this.yAxis);
}

BubbleChart.prototype._scales = function() {
  // Scales
  var xScale = d3.scale.linear().range([0, this.w()]);
  var yScale = d3.scale.linear().range([this.h(), 0]);
  var radiusScale = d3.scale.sqrt().range([0, 40])
  var colorScale = d3.scale.category10();

  this.xScale = xScale;
  this.yScale = yScale;
  this.radiusScale = radiusScale;
  this.colorScale = colorScale;
}

BubbleChart.prototype._draw = function() {
  // Defines a sort order so that the smallest dots are drawn on top.
  var order = function (one, two) { return this.radius(one) - this.radius(two); }

  // Defines the content that goes into a tooltip
  var tooltip = function (d) {
    return categoryLabel + ": " + this.category(d) + "<br>" +
      radiusLabel + ": " + this.radius(d) + "<br>" +
      xLabel + ": " + this.x(d) + "<br>" +
      yLabel + ": " + this.y(d) + "<br>"
  }

  // Defines fill color
  var fill = function(d) { return this.colorScale(this.category(d)); }

  // Positions the bubbles based on data.
  var position = function(bubble) {
    var cx = function (d) { return this.xScale(this.x(d)); }
    var cy = function (d) { return this.yScale(this.y(d)); }
    var r = function(d) { return this.radiusScale(this.radius(d)) };
    bubble .attr("cx", cx.bind(this))
           .attr("cy", cy.bind(this))
           .attr("r",  r.bind(this));
  }

  // Tooltips
  // TODO Make more agnostic.
  // var tip = d3.tip().attr('class', 'tooltip').html(tooltip.bind(this));

  // Add a bubble per row.
  var bubbles = this.bubbles.selectAll(".bubble")
      .data(this.data, function (d) {
        return d.url;
      });

  bubbles.enter().append("circle")
    // .transition()
    .attr("class", "bubble")
    .style("fill", fill.bind(this))
    .call(position.bind(this))
    .sort(order.bind(this))
    // .call(tip)
    // .on('mouseover', tip.show)
    // .on('mouseout', tip.hide);

      //     .append("title")
      // .text(this.category) // Titles

  bubbles.transition()
    .call(position.bind(this))

  bubbles.exit().remove();
}

BubbleChart.prototype.destroy = function(el) {
  // Any clean-up would go here
  // in this example there is nothing to do
};
