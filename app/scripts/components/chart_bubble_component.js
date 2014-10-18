Bubble.ChartBubbleComponent = Ember.Component.extend({
  tagName: 'svg',
  attributeBindings: 'width height'.w(),
  margin: {top: 20, right: 20, bottom: 40, left: 40},

  w: function(){
    return this.get('width') - this.get('margin.left') - this.get('margin.right');
  }.property('width'),

  h: function(){
    return this.get('height') - this.get('margin.top') - this.get('margin.bottom');
  }.property('height'),

  transformG: function(){
    return "translate(" + this.get('margin.left') + "," + this.get('margin.top') + ")";
  }.property(),

  transformX: function(){
    return "translate(0,"+ this.get('h') +")";
  }.property('h'),

  draw: function(){
    // Accessors
    function x(d) { return d[1]; }
    function y(d) { return d[2]; }
    function radius(d) { return d[4]; }
    function color(d) { return d[3]; }
    function key(d) { return d[0]; }

    // Defines a sort order so that the smallest dots are drawn on top.
    function order(a, b) { return radius(b) - radius(a); }

    // Positions the bubbles based on data.
    function position(bubble) {
      bubble .attr("cx", function(d) { return xScale(x(d)); })
             .attr("cy", function(d) { return yScale(y(d)); })
             .attr("r", function(d) { return radiusScale(radius(d)); });
    }

    var width = this.get('w');
    var height = this.get('h');
    var svg = d3.select('#'+this.get('elementId'));

    // Labels
    var xLabel = this.get('data')[0][1];
    var yLabel = this.get('data')[0][2];

    // Scales
    var xScale = d3.scale.linear().range([0, width]);
    var yScale = d3.scale.linear().range([height, 0]);
    var radiusScale = d3.scale.sqrt().range([0, 40])
    var colorScale = d3.scale.category10();

    // Data
    var data = this.get('data').splice(1);

    // Domains
    radiusScale.domain(d3.extent(data, radius));

    xScale.domain(d3.extent(data, x));
    // Extend xScale to cover the largest bubble
    xScale.domain(
      [
        d3.min(data, x),
        d3.max(data, x) + xScale.invert(radiusScale(d3.max(data, radius)))
      ]
    );

    // Extend the yScale to cover the largest bubble
    yScale.domain([0, d3.max(data, y)]);
    yScale.domain(
      [
        0,
        d3.max(data, y) + yScale.invert(height - radiusScale(d3.max(data, radius)))
      ]
    );

    // The x & y axes.
    var xAxis = d3.svg.axis().orient("bottom").scale(xScale).ticks(12, d3.format(",d"));
    var yAxis = d3.svg.axis().scale(yScale).orient("left");

    // Tooltips
    // TODO Make more agnostic.
    tip = d3.tip().attr('class', 'tooltip').html(function(d) {
      return d[0] + "<br>" +
        xLabel + ": " + x(d) + "<br>" +
        yLabel + ": " + y(d) + "<br>"
    });

    svg = svg.append("g")
      .attr("transform", this.get('transformG'));

    // Add the x-axis.
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", this.get('transformX'))
        .call(xAxis);

    // Add the y-axis.
    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);

    // Add an x-axis label.
    svg.append("text")
        .attr("class", "x label")
        .attr("text-anchor", "end")
        .attr("x", width)
        .attr("y", height - 6)
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
        .style("fill", function(d) { return colorScale(color(d)); })
        .call(position)
        .sort(order)
        .call(tip)
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide);


    // Add a title
    bubble.append("title")
      .text(function(d) { return d[0]; });
  },

  didInsertElement: function(){
    this.draw();
  }
});
