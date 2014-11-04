var BubbleChart = function() {};

BubbleChart.prototype.create = function(el, properties, data) {
  this.svg = d3.select(el).append('svg')
    .attr('class', 'd3')
    .attr('width', properties.width)
    .attr('height', properties.height);

  this.properties = properties;
  this.width = properties.width;
  this.height = properties.height;

  this._setAccessors();

  this.margin = {top: 20, right: 20, bottom: 40, left: 40};

  this.data = data;
  this._scales();
  this._setup();
  this.update();
  return this;
}

BubbleChart.prototype._setAccessors = function() {
  this.x = function(d) { return d[this.properties.x]; }
  this.y = function(d) { return d[this.properties.y]; }
  this.radius = function(d) { return d[this.properties.radius]; }
  this.category = function(d) { return d[this.properties.category]; }
  this.tooltip = function(d) { return d[this.properties.tooltip]; }
}

BubbleChart.prototype._setLabels = function() {
  function capitalise(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  this.xLabel = capitalise(this.properties.x);
  this.yLabel = capitalise(this.properties.y);
  this.radiusLabel = capitalise(this.properties.radius);
  this.categoryLabel = capitalise(this.properties.category);
}

BubbleChart.prototype.update = function(properties, data) {
  this.properties = properties || this.properties;
  this.data = data || this.data;
  this._setLabels();
  this._setAccessors();
  this._setDomains();
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
  // Labels
  this.xAxis = d3.svg.axis().orient("bottom").scale(this.xScale).ticks(12, d3.format(",d"));
  this.yAxis = d3.svg.axis().scale(this.yScale).orient("left");

  // Tooltips
  var tooltip = function (d) {
    return '<strong>' + this.tooltip(d) + '</strong><br>' +
      this.categoryLabel + ": " + this.category(d) + "<br>" +
      this.radiusLabel + ": " + this.radius(d) + "<br>" +
      this.xLabel + ": " + this.x(d) + "<br>" +
      this.yLabel + ": " + this.y(d) + "<br>"
  }

  var direction = function (d) {
    var upper = this.y(d) > (0.75 * this.yScale.domain()[1])
    var left = this.x(d) < (0.25 * this.xScale.domain()[1])
    var right = this.x(d) > (0.75 * this.xScale.domain()[1])

    if(upper && left) {
      return 'se';
    } else if (upper && right) {
      return 'sw';
    } else if (upper) {
      return 's';
    } else if (right) {
      return 'w';
    } else if (left) {
      return 'e';
    } else {
      return 'n';
    }
  }

  // Tooltips
  this.tip = d3.tip().attr('class', 'tooltip').html(tooltip.bind(this));

  this.tip.direction(direction.bind(this));

  svg = this.svg
    .call(this.tip)
    .append("g")
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
      .text(this.xLabel);
  // Add a y-axis label.
  svg.append("text")
      .attr("class", "y label")
      .attr("text-anchor", "end")
      .attr("y", 6)
      .attr("dy", ".75em")
      .attr("transform", "rotate(-90)")
      .text(this.yLabel);

  this.bubbles = svg.append("g")
    .attr("class", "bubbles");
}

BubbleChart.prototype._setDomains = function () {
  // Domains
  this.radiusScale.domain([-1, d3.max(this.data, this.radius.bind(this))]);

  this.xScale.domain(d3.extent(this.data, this.x.bind(this)));
  // Extend xScale to cover the largest and smallest bubble
  this.xScale.domain(
    [
      0,
      d3.max(this.data, this.x.bind(this)) +
        this.xScale.invert(this.radiusScale(d3.max(this.data, this.radius.bind(this))))
    ]
  );

  // Extend the yScale to cover the largest bubble
  this.yScale.domain([0, d3.max(this.data, this.y.bind(this))]);
  this.yScale.domain(
    [
      0,
      d3.max(this.data, this.y.bind(this)) + this.yScale.invert(this.h() -
        this.radiusScale(d3.max(this.data, this.radius.bind(this))))
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

  // Add a bubble per row.
  var bubbles = this.bubbles.selectAll(".bubble")
    .data(this.data)
    // , function (d) {
    //   return d.url;
    // });

  bubbles.enter().append("circle")
    // .transition()
    .attr("class", "bubble")
    .style("fill", fill.bind(this))
    .call(position.bind(this))
    .sort(order.bind(this))
    .on('mouseover', this.tip.show)
    .on('mouseout', this.tip.hide)
    .on('click', function (d) {
      window.location = d.url;
    });

      // .append("title")
      //   .text(this.category) // Titles

  bubbles.transition()
    .call(position.bind(this))

  bubbles.exit().remove();
}

BubbleChart.prototype.destroy = function(el) {
  // Any clean-up would go here
  // in this example there is nothing to do
};
