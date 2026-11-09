/*
	wa-throwable-start
*/
// the logo bubbles of the clients section fall into their box, pile up and can be dragged with the pointer (matter.js, gsap and jQuery are needed).
// The box is [wa-matter-scene], every bubble is an [wa-matter-item]: the item is the box that is measured (the size of the body), its first child is
// the part that moves and turns. Options go in data-throwable-options: {"roundness": "circle"} (round bodies, the items are square), "round" (pill
// shaped) or "sharp" (a plain rectangle, the default)
(function ($) {
	"use strict";

	const defaults = {
		roundness: "sharp"
	};

	// the resize is handled once the window has stopped moving for 250ms
	const debounce = function (fn, wait) {
		let timer;
		return function (...args) {
			clearTimeout(timer);
			timer = setTimeout(() => fn.apply(this, args), wait);
		};
	};

	class Throwable {
		constructor(element, options) {
			this.options = { ...defaults, ...options };
			this.element = element;
			this.items = element.querySelectorAll("[wa-matter-item]");
			this.bodies = [];
			this.onResize = debounce(this.refresh.bind(this), 250);
			this.init();
		}

		init() {
			this.createWorld();
			this.createBoundaries();
			this.createBodies();
			this.watchRunner();
			this.makeItRain();
			window.addEventListener("resize", this.onResize);
		}

		// the world: the gravity pulls down, the pointer drags the bodies (the wheel is left to the page)
		createWorld() {
			this.height = this.element.offsetHeight;
			this.width = this.element.offsetWidth;
			this.engine = Matter.Engine.create();
			this.runner = Matter.Runner.create();
			this.mouse = Matter.Mouse.create(this.element);
			this.element.removeEventListener("mousewheel", this.mouse.mousewheel);
			this.element.removeEventListener("DOMMouseScroll", this.mouse.mousewheel);
			this.element.addEventListener("mouseleave", this.mouse.mouseup);
			this.mouseConstraint = Matter.MouseConstraint.create(this.engine, {
				mouse: this.mouse,
				constraint: {
					render: { visible: false }
				}
			});
			this.engine.gravity.y = 0.8;
			Matter.Composite.add(this.engine.world, [this.mouseConstraint]);
			Matter.Runner.start(this.runner, this.engine);

			// while a bubble is held the box takes the pointer, so the drag goes on when the pointer leaves the bubble
			Matter.Events.on(this.mouseConstraint, "mousedown", () => {
				this.element.style.pointerEvents = "auto";
			});
			Matter.Events.on(this.mouseConstraint, "mouseup", () => {
				this.element.style.pointerEvents = "";
			});
			this.runner.enabled = false;
		}

		// the walls: left, right and the floor (the top comes once the bubbles are in)
		createBoundaries() {
			this.boundStart = Matter.Bodies.rectangle(-250, this.height / 2, 500, 4 * this.height, { isStatic: true });
			this.boundEnd = Matter.Bodies.rectangle(this.width + 250, this.height / 2, 500, 4 * this.height, { isStatic: true });
			this.boundBottom = Matter.Bodies.rectangle(0, this.height + 250, 2 * this.width, 500, { isStatic: true });
			Matter.Composite.add(this.engine.world, [this.boundBottom, this.boundStart, this.boundEnd]);
		}

		createTopBound() {
			this.boundTop = Matter.Bodies.rectangle(0, -250, 2 * this.width, 500, { isStatic: true });
			Matter.Composite.add(this.engine.world, [this.boundTop]);
		}

		// a body of the size of the item: it waits above the box (static) until the rain starts
		makeBody(rect, x, y, angle) {
			const settings = { angle: angle, isStatic: true, restitution: 0.3 };

			if (this.options.roundness === "circle") {
				return Matter.Bodies.circle(x, y, rect.width / 2, settings);
			}

			if (this.options.roundness === "round") {
				settings.chamfer = { radius: rect.height / 2 };
			}

			return Matter.Bodies.rectangle(x, y, rect.width, rect.height, settings);
		}

		createBodies() {
			this.items.forEach((item, index) => {
				const inner = item.firstElementChild;
				const rect = item.getBoundingClientRect();
				const setX = gsap.quickSetter(item, "x", "px");
				const setY = gsap.quickSetter(item, "y", "px");
				const angle = gsap.utils.random(-0.2 * Math.PI, 0.2 * Math.PI);
				const x = gsap.utils.random(rect.width / 2, this.width - rect.width / 2);
				const y = -rect.width - (index * rect.height + 10);
				const body = this.makeBody(rect, x, y, angle);

				this.bodies.push(body);
				Matter.Composite.add(this.engine.world, [body]);

				Matter.Events.on(this.runner, "tick", () => {
					if (!this.runner.enabled) return;
					inner.style.transform = "translate(-50%, -50%) rotate(" + body.angle.toFixed(2) + "rad)";
					setY(body.position.y.toFixed(1));
					setX(body.position.x.toFixed(1));
				});
			});
		}

		// the engine only runs while the box is on the screen
		// the last entry is the current one (a slow frame can bring the old "not on the screen" entry together with the new one)
		watchRunner() {
			new IntersectionObserver((entries) => {
				this.runner.enabled = entries[entries.length - 1].isIntersecting;
			}).observe(this.element);
		}

		// the first time the box shows, the bubbles fade in and fall one after the other (80ms apart)
		makeItRain() {
			new IntersectionObserver((entries, observer) => {
				if (!entries[entries.length - 1].isIntersecting) return;

				this.items.forEach((item) => {
					gsap.to(item, { opacity: 1, duration: 0.35 });
				});
				this.startRain();
				observer.disconnect();
			}).observe(this.element);
		}

		startRain() {
			this.bodies.forEach((body, index) => {
				setTimeout(() => {
					Matter.Body.setStatic(body, false);
				}, 80 * index);
			});

			// the lid goes on when the last bubble is past the middle of the box, so none of them leaves it through the top
			let lidOn = false;
			Matter.Events.on(this.runner, "tick", () => {
				if (!lidOn && this.bodies[this.bodies.length - 1].position.y > this.element.offsetHeight / 2) {
					this.createTopBound();
					lidOn = true;
				}
			});
		}

		// the box or the bubbles changed their size: walls and bodies follow
		refresh() {
			if (this.height === this.element.offsetHeight && this.width === this.element.offsetWidth) return;

			this.height = this.element.offsetHeight;
			this.width = this.element.offsetWidth;
			setTimeout(() => {
				this.updateBoundaries();
				this.updateBodies();
			});
		}

		updateBoundaries() {
			const place = (body, x, y, w, h) => {
				Matter.Body.setPosition(body, { x: x, y: y });
				Matter.Body.setVertices(body, Matter.Bodies.rectangle(x, y, w, h, { isStatic: true }).vertices);
			};

			if (this.boundTop) place(this.boundTop, 0, -250, 2 * this.width, 500);
			place(this.boundStart, -250, this.height / 2, 500, 4 * this.height);
			place(this.boundEnd, this.width + 250, this.height / 2, 500, 4 * this.height);
			place(this.boundBottom, 0, this.height + 250, 2 * this.width, 500);
		}

		updateBodies() {
			this.items.forEach((item, index) => {
				const body = this.bodies[index];
				const rect = item.getBoundingClientRect();

				if (this.options.roundness === "circle") {
					const scale = rect.width / 2 / body.circleRadius;
					Matter.Body.scale(body, scale, scale);
				} else {
					const next = this.makeBody(rect, body.position.x, body.position.y, body.angle);
					Matter.Body.setVertices(body, next.vertices);
				}

				if (body.position.y > this.height) {
					Matter.Body.setPosition(body, { x: body.position.x, y: this.height / 2 });
				}

				if (body.position.x > this.width) {
					Matter.Body.setPosition(body, {
						x: gsap.utils.random(rect.width / 2, this.width - rect.width / 2),
						y: body.position.y
					});
				}
			});
		}
	}

	$.fn.waThrowable = function (options) {
		return this.each(function () {
			const settings = { ...$(this).data("throwable-options"), ...options };
			if (!$.data(this, "plugin_waThrowable")) {
				$.data(this, "plugin_waThrowable", new Throwable(this, settings));
			}
		});
	};
})(jQuery);

jQuery(document).ready(function ($) {
	$("[wa-matter-scene]").waThrowable();
});
/*
	wa-throwable-end
*/
