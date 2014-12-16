var BubbleChart = function() {};

BubbleChart.prototype.create = function(el, properties, data) {
    this.svg = d3.select(el).append('svg')
        .attr('class', 'd3')
        .attr('width', properties.width)
        .attr('height', properties.height);

    this.properties = properties;
    this.width = properties.width;
    this.height = properties.height;
    this.margin = {top: 20, right: 20, bottom: 100, left: 80};
    this.data = data;

    this._setup();
    this.update();

    return this;
}

BubbleChart.prototype._setAccessors = function() {
    this.x = function(d) { return d[this.properties.x]; }
    this.y = function(d) { return d[this.properties.y]; }
    this.category = function(d) { return d[this.properties.category]; }
    this.tooltip = function(d) { return d[this.properties.tooltip]; }
}

BubbleChart.prototype.radius = function (d) {
    if(this.properties.radius) {
        return d[this.properties.radius];
    } else {
        return 1;
    }
}

BubbleChart.prototype._color = function (d) {
    var color = this.properties.colors[d];
    if(color) {
        return color;
    } else {
        return this.properties.colors.default;
    }
}

BubbleChart.prototype._scales = function() {
    // Scales
    var xScale = d3.scale.linear().range([0, this.w()]);
    var yScale = d3.scale.linear().range([this.h(), 0]);

    if(this.properties.radius) {
        var radiusScale = d3.scale.sqrt().range([0, 40]);
    } else {
        var radiusScale = d3.scale.linear().range([0,4]);
    }

    if(this.properties.colors) {
        var colorScale = this._color;
    } else {
        var colorScale = d3.scale.category10();
    }

    this.xScale = xScale;
    this.yScale = yScale;
    this.radiusScale = radiusScale;
    this.colorScale = colorScale;
}

BubbleChart.prototype._axes = function () {
    this.xAxis = d3.svg.axis().orient("bottom").scale(this.xScale).ticks(12, d3.format(",d"));
    this.yAxis = d3.svg.axis().scale(this.yScale).orient("left");
}

BubbleChart.prototype._setup  = function () {
    this._setAccessors();
    this._scales();
    this._axes();
    this._setDomains();
    this._setLabels();

    // Tooltips
    var tooltip = function (d) {
        return '<strong>' +
            this.tooltipLabel + ": " + this.tooltip(d) + '</strong><br>' +
            this.categoryLabel + ": " + this.category(d) + "<br>" +
            this.properties.xLabel + ": " + this.x(d) + "<br>" +
            this.properties.yLabel + ": " + this.y(d) + "<br>" +
            this.properties.radiusLabel + ": " + this.radius(d) + "<br>"
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

    this.bubbles = svg.append("g")
        .attr("class", "bubbles");
}

BubbleChart.prototype.update = function(properties, data) {
    this.properties = _.extend(this.properties, properties);
    this.data = data || this.data;
    this._setAccessors();
    this._scales();
    this._axes();
    this._setDomains();
    this._setLabels();
    this._draw();
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

BubbleChart.prototype._setLabels = function() {
    function capitalise(s) {
        return s.charAt(0).toUpperCase() + s.slice(1);
    }

    // Add an x-axis label.
    this.svg.append("text")
            .attr("class", "x label")
            .attr("text-anchor", "middle")
            .attr("x", this.w() / 2 + this.margin.left)
            .attr("y", this.height - (this.margin.bottom / 2))
            .text(this.properties.xLabel);

    // Add a y-axis label.
    this.svg.append("text")
            .attr("class", "y label")
            .attr("text-anchor", "middle")
            .attr("y", 0)
            .attr("x", 0 - this.h() / 2)
            .attr("dy", "0.75em")
            .attr("transform", "rotate(-90)")
            .text(this.properties.yLabel);

    this.tooltipLabel = capitalise(this.properties.tooltip);
    this.categoryLabel = capitalise(this.properties.category);
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



BubbleChart.prototype._draw = function() {
    // Defines a sort order so that the smallest dots are drawn on top.
    var order = function (a, b) { return this.radius(b) - this.radius(a); }

    // Defines fill color
    var fill = function(d) { return this.colorScale(this.category(d)); }

    // Positions the bubbles based on data.
    var position = function(bubble) {
        var cx = function (d) { return this.xScale(this.x(d)); }
        var cy = function (d) { return this.yScale(this.y(d)); }
        var r = function(d) { return this.radiusScale(this.radius(d)); }
        bubble .attr("cx", cx.bind(this))
                     .attr("cy", cy.bind(this))
                     .attr("r",  r.bind(this));
    }

    // Due to sorting, the default D3 array index data-join doesn't work.
    // So we assign ids to each datum.
    this.data = this.data.map(function (d, i) {
        d.id = i;
        return d;
    }).sort(order.bind(this))

    // Add a bubble per row.
    var bubbles = this.bubbles.selectAll(".bubble")
        .data(this.data, function(d) { return d.id })

    bubbles.enter().insert("circle")
        .attr("class", "bubble")
        .style("fill", fill.bind(this))
        .call(position.bind(this))
        .on('mouseover', this.tip.show)
        .on('mouseout', this.tip.hide)
        .on('click', function (d) {
            window.location = d.url;
        });

        // .append("title")
        //   .text(this.category) // Titles

    bubbles.transition()
        .call(position.bind(this))

    bubbles.order()

    bubbles.exit().remove();
}

BubbleChart.prototype.destroy = function(el) {
    // Any clean-up would go here
    // in this example there is nothing to do
};
