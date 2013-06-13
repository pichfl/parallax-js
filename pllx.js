!function (context, $) {

	/**
	 * Creates a new Pllx instance
	 *
	 * @param elements an array of selectors or ender objects
	 * @param depths an array of the corresponding depths
	 * @param options additional options for setup
	 * @constructor
	 */
	function Pllx(elements, depths, options) {
		this.options = {
			context: $(context) // defaults to endered window
			, target: undefined // will default to the context
			, autoAttach: true
			, motionDegrees: {
				x: 70
				, y: 50
			}
			, motionMax: {
				x: 1
				, y: 1
			}
			, motionMin: {
				x: -1
				, y: -1
			}
		}

		// Merge options
		for (t in options) {
			this.options[t] = options[t];
		}
		this.options.target = this.options.target || this.options.context;

		// Create layers
		this.setup(elements, depths);

		// Attach
		if (this.options.autoAttach) {
			this.attach();
		}
	}

	// Helpers
	function moveable() {
		return (window.DeviceOrientationEvent !== undefined);
	}


	// Pllx methods

	Pllx.prototype.setup = function (elements, depths) {
		var layers = []
			, i
			, targetOffset = (this.options.target[0] !== window) ? this.options.target.offset() : {
				top: 0
				, left: 0
			};

		for (i = 0; i < elements.length; i++) {
			var els = (typeof elements[i] === 'string') ? $(elements[i]) : elements[i]
				, range = depths[i] || 0
				, rangeX = 0
				, rangeY = 0
				, initialX = []
				, initialY = [];

			if (els.length < 1) {
				continue;
			}

			if (typeof range !== 'number') {
				rangeX = range.x;
				rangeY = range.y;
			} else {
				rangeX = rangeY = range;
			}

			els.each(function (el) {
				var $el = $(el)
					, x = parseInt($el.css('left'), 10)
					, y = parseInt($el.css('top'), 10)

				x -= Math.floor((rangeX)/2);
				y -= Math.floor((rangeY)/2);

				initialX.push(x);
				initialY.push(y);
			}, this);

			layers.push({
				elements: els
				, rangeX: rangeX
				, rangeY: rangeY
				, initialX: initialX
				, initialY: initialY
			});
		}

		this.layers = layers;
	}

	var motionX = null
		, motionY = null;

	Pllx.prototype.render = function (event) {
		var x = 0
			, y = 0
			, ratioHorizontal = 0
			, ratioVertical = 0
			, i;

		if (event.type == 'mousemove') {
			var offset = {};
			if (this.options.target[0] === window) {
				var v = $.viewport();

				offset = {
					top: 0
					, left: 0
					, width: v.width
					, height: v.height
				}
			} else {
				offset = this.options.target.offset()
			}

			x = event.pageX - offset.left;
			y = event.pageY - offset.top;

			ratioHorizontal = x / offset.width;
			ratioVertical = y / offset.height
		} else if (event.type == 'deviceorientation' && event.gamma !== undefined) {
			x = event.gamma;
			y = event.beta;

			var v = $.viewport();

			if (window.orientation) {
				// Swap x and y in Landscape orientation (is that a good idea?)
				if (Math.abs(window.orientation) === 90) {
					x = event.beta;
					y = event.gamma;
				}

				// Invert x and y in upsidedown orientations
				if (window.orientation < 0) {
					x = -x;
					y = -y;
				}
			}

			x = x - (motionX === null) ? x : motionX;
			y = y - (motionY === null) ? y : motionY;

			// Admittedly fuzzy measurements
			x = x / this.options.motionDegrees.x;
			y = y / this.options.motionDegrees.y;

			// Ensure not outside of expected range, -1 to 1
			x = x < this.options.motionMin.x ? this.options.motionMin.x : (x > this.options.motionMax.x ? this.options.motionMax.x : x);
			y = y < this.options.motionMin.y ? this.options.motionMin.y : (y > this.options.motionMax.y ? this.options.motionMax.y : y);
			// Normalize from -1 to 1 => 0 to 1
			x = (x + 1) / 2;
			y = (y + 1) / 2;

			ratioHorizontal = x / this.options.motionMax.x;
			ratioVertical = y / this.options.motionMax.y;
		}

		for (i = 0; i < this.layers.length; i++) {
			var layer = this.layers[i];

			layer.elements.each(function(el, idx) {
				$(el).css({
					'top': layer.initialY[idx] + layer.rangeY * ratioVertical
					, 'left': layer.initialX[idx] + layer.rangeX * ratioHorizontal
				});
			});
		}
	}

	Pllx.prototype.attach = function (target) {
		var t = target || this.options.target;

		t.on('mousemove.pllx', function (event) {
			this.render(event);
		}.bind(this));

		if (moveable()) {
			this.options.context.on('deviceorientation.pllx', function (event) {
				this.render(event.originalEvent);
			}.bind(this));
		}

	}

	$.ender({

		pllx: function (elements, depths, options) {
			return new Pllx(elements, depths, options);
		}

	});


}(this, ender);