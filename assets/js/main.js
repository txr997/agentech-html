/*
	Template Name: KingFeast - Restaurant HTML Template
	Author: https://themexriver.com/
	Version: 1.0
*/

(function ($) {
"use strict";

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;


/*
	preloader-1 — the light runs over the logo (css) while the page loads; on window load, once the panel has been up for a
	moment, it fades out
*/
function agPreloaderInit() {

	var loader = document.querySelector(".ag-preloader-1");
	if (!loader) return null;

	if (prefersReducedMotion()) {
		return {
			done: function () {
				loader.remove();
				afterPreloader();
			}
		};
	}

	var shownAt = performance.now();
	var exited = false;

	// the mask of the light (data-mask-image) is set by main-common.js before this runs, so the light can show now
	loader.classList.add("is-ready");

	gsap.from(loader.firstElementChild, {
		opacity: 0,
		duration: .8,
		ease: "power2.out"
	});

	function exit() {
		if (exited) return;
		exited = true;

		var tl = gsap.timeline();

		tl.to(loader, {
			opacity: 0,
			duration: .8,
			ease: "power2.inOut"
		});

		// the intro starts while the panel is still fading
		tl.call(afterPreloader, null, .3);
		tl.call(function () {
			loader.remove();
		}, null, .85);
	}

	return {
		// it stays at least 1.6s, so a page that is ready at once does not flash the loader and the light runs over the logo at least once
		done: function () {
			gsap.delayedCall(Math.max(0, 1.6 - (performance.now() - shownAt) / 1000), exit);
		}
	};
}

var agPreloader = agPreloaderInit();


/*
	hero-1 intro — parked before the preloader lifts, played right after: the two red lights swell in, then the
	letters of the big title come up from behind the bottom edge one after another, clearing from a blur
*/
var kfHero1 = null;
var kfHero1First = null;
var kfHero1Swiper = null;

// the plain words of a title become masked words, anything else inside it stays as it is
function kfHeroWords(title, maskClass, wordClass) {
	var words = [];

	Array.prototype.slice.call(title.childNodes).forEach(function (node) {
		if (node.nodeType !== 3) return;

		var frag = document.createDocumentFragment();
		node.textContent.split(/(\s+)/).forEach(function (part) {
			if (!part) return;
			if (!part.trim()) {
				frag.appendChild(document.createTextNode(" "));
				return;
			}

			var mask = document.createElement("span");
			var word = document.createElement("span");
			mask.className = maskClass || "sb-split-mask";
			word.className = wordClass || "sb-split-word";
			word.textContent = part;
			mask.appendChild(word);
			frag.appendChild(mask);
			words.push(word);
		});
		title.replaceChild(frag, node);
	});

	return words;
}

function kfHero1Park() {
	if (prefersReducedMotion()) return;

	if (kfHero1First) kfHero1First.park();

	var letters = document.querySelectorAll(".kf-hero-1-big-title span");
	var glows = document.querySelectorAll(".kf-hero-1-glow");
	if (!letters.length && !glows.length) return;

	gsap.set(glows, { opacity: 0, scale: .3 });
	gsap.set(letters, { yPercent: 120, opacity: 0, filter: "blur(12px)" });

	kfHero1 = { letters: letters, glows: glows };
}

function kfHero1Play() {
	if (kfHero1First) kfHero1First.play();
	if (!kfHero1) return;
	var hero = kfHero1;

	gsap.timeline({
		defaults: { ease: "power3.out" },
		onComplete: function () {
			gsap.set(Array.prototype.slice.call(hero.glows).concat(Array.prototype.slice.call(hero.letters)), { clearProps: "opacity,filter,transform" });
		}
	})
		.to(hero.glows, { opacity: 1, scale: 1, duration: 2.2, ease: "power2.out", stagger: .25 }, 0)
		.to(hero.letters, { yPercent: 0, opacity: 1, filter: "blur(0px)", duration: 1.3, stagger: .08 }, .3);
}


/*
	hero-1 sliders — the big slider opens each slide like an iris (plate reveal) and serves its text after it; the
	card slider turns its cards like a drum
*/
function kfHero1Slider() {
	if (!$(".kf-hero-1-slider").length) return;

	var slider = document.querySelector(".kf-hero-1-slider");
	var scenes = [];
	var rim = null;

	if (!prefersReducedMotion()) {
		$(".kf-hero-1-slider .swiper-slide").each(function () {
			var title = this.querySelector(".kf-hero-1-title");

			scenes.push({
				item: this.querySelector(".kf-hero-1-item"),
				img: this.querySelector(".kf-hero-1-img"),
				words: title ? kfHeroWords(title) : [],
				rest: Array.prototype.slice.call(this.querySelectorAll(".kf-hero-1-disc, .kf-pr-btn-1"))
			});
		});

		rim = document.createElement("div");
		rim.className = "kf-hero-1-rim";
		slider.appendChild(rim);
		gsap.set(rim, { autoAlpha: 0 });
	}

	// parked: the slide is closed (a circle of nothing) and its text is waiting below its line
	function park(scene) {
		gsap.killTweensOf([scene.item, scene.img].concat(scene.words, scene.rest));
		gsap.killTweensOf(rim);
		// the button has a css transition for its hover, it would lag behind gsap
		gsap.set(scene.rest, { transition: "none", y: 28, opacity: 0, filter: "blur(6px)" });
		gsap.set(scene.words, { yPercent: 115, rotate: 5, opacity: 0, filter: "blur(10px)", transformOrigin: "0% 100%" });
		scene.item.style.clipPath = "circle(0px at 50% 58%)";
	}

	function serve(scene) {
		var targets = [scene.item, scene.img].concat(scene.words, scene.rest);
		var iris = { r: 0 };
		// the circle opens at 50% 58% and has to reach the farthest corner
		var reach = Math.hypot(slider.clientWidth / 2, slider.clientHeight * .58) + 10;

		gsap.timeline({
			defaults: { ease: "power3.out" },
			onComplete: function () {
				scene.item.style.clipPath = "";
				gsap.set(targets, { clearProps: "transform,opacity,filter,transition" });
			}
		})
			.to(iris, {
				r: reach,
				duration: 1.5,
				ease: "power3.inOut",
				onUpdate: function () {
					scene.item.style.clipPath = "circle(" + iris.r + "px at 50% 58%)";
					rim.style.width = rim.style.height = iris.r * 2 + "px";
				}
			}, 0)
			.fromTo(rim, { autoAlpha: 0 }, { autoAlpha: 1, duration: .2 }, 0)
			.to(rim, { autoAlpha: 0, duration: .3 }, 1.2)
			.fromTo(scene.img, { scale: 1.2 }, { scale: 1, duration: 2, ease: "power2.out" }, 0)
			// the words wait until the circle has reached the text
			.to(scene.words, { yPercent: 0, rotate: 0, opacity: 1, filter: "blur(0px)", duration: 1.2, ease: "power4.out", stagger: .08 }, .9)
			.to(scene.rest, { y: 0, opacity: 1, filter: "blur(0px)", duration: 1, stagger: .15 }, 1.25);
	}

	kfHero1Swiper = new Swiper(".kf-hero-1-slider", {
		effect: "fade",
		fadeEffect: { crossFade: true },
		speed: 1500,
		rewind: true,
		on: {
			slideChange: function (swiper) {
				var scene = scenes[swiper.activeIndex];
				var leaving = swiper.slides[swiper.previousIndex];

				// the slide that goes out stays on screen until the circle has covered it
				Array.prototype.forEach.call(swiper.slides, function (slide) {
					slide.classList.remove("is-leaving");
				});
				if (leaving) leaving.classList.add("is-leaving");

				if (!scene) return;

				park(scene);
				serve(scene);
			},
			slideChangeTransitionEnd: function (swiper) {
				Array.prototype.forEach.call(swiper.slides, function (slide) {
					slide.classList.remove("is-leaving");
				});
			}
		},
		autoplay: {
			delay: 5000,
			disableOnInteraction: false,
		},
	});

	// the slider waits behind the preloader, afterPreloader starts it; the first slide opens right then too,
	// parked before the preloader lifts like the rest of the hero
	kfHero1Swiper.autoplay.stop();

	if (scenes.length) {
		kfHero1First = {
			park: function () {
				park(scenes[0]);
			},
			play: function () {
				serve(scenes[0]);
			}
		};
	}

	// a looping vertical slider needs more slides than the cards it shows, with only two it jumps instead of sliding
	var $cards = $(".kf-hero-1-card-slider .swiper-wrapper");
	if ($cards.children().length < 4) {
		$cards.append($cards.children().clone().attr("aria-hidden", "true"));
	}

	// the card leaves upwards tipping back into the screen, the next one rises tipped the other way, like cards on a drum
	new Swiper(".kf-hero-1-card-slider", {
		direction: "vertical",
		effect: "creative",
		creativeEffect: {
			perspective: true,
			limitProgress: 1,
			// negative opacity = the card is invisible for the first part of the way: the one leaving is gone just before half way
			// and the one arriving shows up just after it, so the two never overlap as ghosts
			prev: {
				translate: [0, "-40%", -300],
				rotate: [90, 0, 0],
				opacity: -1.2,
			},
			next: {
				translate: [0, "40%", -300],
				rotate: [-90, 0, 0],
				opacity: -0.8,
			},
		},
		speed: 900,
		loop: true,
		autoplay: {
			delay: 3500,
			disableOnInteraction: false,
		},
	});
}


/*
	hero-2 sliders — the thumbs on the right lead: they go round on their own, the one in the middle is the plate on show.
	Each plate slide builds itself when it comes: the shape behind turns in, then the plate turns in, then the words
	"Special Platter" come up (the order of the plates is the order of the thumbs)
*/
var kfHero2First = null;
var kfHero2Swiper = null;

function kfHero2Slider() {
	if (!$(".kf-hero-2-preview-slider").length) return;

	// a looping slider needs more slides than the three it shows, with only three it jumps instead of sliding
	var $thumbs = $(".kf-hero-2-preview-slider .swiper-wrapper");
	$thumbs.append($thumbs.children().clone().attr("aria-hidden", "true"));

	var plates = $(".kf-hero-2-slider-img .swiper-slide").length;
	var scenes = [];
	var ready = false;
	var first = 1;

	if (!prefersReducedMotion()) {
		$(".kf-hero-2-slider-img .swiper-slide").each(function () {
			scenes.push({
				shape: this.querySelector(".kf-hero-2-slider-img-shape"),
				plate: this.querySelector(".kf-hero-2-slider-img-plate"),
				special: this.querySelector(".kf-hero-2-slider-img-special .text"),
				platter: this.querySelector(".kf-hero-2-slider-img-platter .text")
			});
		});
	}

	function parts(scene) {
		return [scene.shape, scene.plate, scene.special, scene.platter];
	}

	// parked: nothing of the slide is on show yet
	function park(scene) {
		gsap.killTweensOf(parts(scene));
		gsap.set(scene.shape, { opacity: 0, rotate: 120, scale: .7, transformOrigin: "48% 42%" });
		gsap.set(scene.plate, { opacity: 0, rotate: 90, scale: .5 });
		gsap.set([scene.special, scene.platter], { opacity: 0, y: 36, filter: "blur(8px)" });
	}

	function serve(scene) {
		gsap.timeline({
			defaults: { ease: "power3.out" },
			onComplete: function () {
				gsap.set(parts(scene), { clearProps: "transform,opacity,filter,transformOrigin" });
			}
		})
			.to(scene.shape, { opacity: 1, rotate: 0, scale: 1, duration: 1.4 }, 0)
			.to(scene.plate, { opacity: 1, rotate: 0, scale: 1, duration: 1.2 }, .5)
			.to(scene.special, { opacity: 1, y: 0, filter: "blur(0px)", duration: 1, ease: "power4.out" }, 1.15)
			.to(scene.platter, { opacity: 1, y: 0, filter: "blur(0px)", duration: 1, ease: "power4.out" }, 1.3);
	}

	var plateSlider = new Swiper(".kf-hero-2-slider-img", {
		effect: "fade",
		fadeEffect: { crossFade: true },
		speed: 700,
		initialSlide: first,
		allowTouchMove: false,
		on: {
			slideChange: function (swiper) {
				var scene = scenes[swiper.activeIndex];

				if (!ready || !scene) return;

				park(scene);
				serve(scene);
			}
		}
	});

	kfHero2Swiper = new Swiper(".kf-hero-2-preview-slider", {
		direction: "vertical",
		slidesPerView: 3,
		spaceBetween: 71.5,
		centeredSlides: true,
		initialSlide: first,
		loop: true,
		speed: 900,
		grabCursor: true,
		slideToClickedSlide: true,
		// a plate needs about 2.5s to build up, the rest of the 5s it is on show whole
		autoplay: {
			delay: 5000,
			disableOnInteraction: false,
		},
		on: {
			slideChange: function (swiper) {
				plateSlider.slideTo(swiper.realIndex % plates);
			},
		},
	});

	// waits behind the preloader like the hero-1 slider: the first slide is parked now, afterPreloader plays it and starts the thumbs
	kfHero2Swiper.autoplay.stop();

	if (scenes.length) {
		park(scenes[first]);

		kfHero2First = {
			play: function () {
				ready = true;
				serve(scenes[first]);
			}
		};
	}
}


/*
	hero-3 slider — the three round photos under the plate lead: a click on one shows its plate, the one that is up (the red arch) is the
	plate on show. Each slide builds itself when it comes: the plate turns in, the line with its four cards fades in behind it, the
	slice and the peppers show once the plate has settled (kfHero3Drift then moves them with the cursor), then the words come up
	one after another
*/
var kfHero3First = null;
var kfHero3Swiper = null;

function kfHero3Slider() {
	if (!$(".kf-hero-3-slider").length) return;

	var $thumbs = $(".kf-hero-3-thumb");
	var scenes = [];
	var ready = false;
	// the middle plate is up when the page opens, like the design
	var first = 1;

	if (!prefersReducedMotion()) {
		$(".kf-hero-3-slider .swiper-slide").each(function () {
			var pepper = this.querySelector(".kf-hero-3-pepper");

			scenes.push({
				plate: this.querySelector(".kf-hero-3-plate"),
				ring: this.querySelector(".kf-hero-3-ring"),
				slice: this.querySelector(".kf-hero-3-slice"),
				pepper: pepper,
				// the peppers are 53% in the css, they come in to that and not to 1
				pepperTo: pepper ? parseFloat(getComputedStyle(pepper).opacity) : 1,
				cards: this.querySelectorAll(".kf-hero-3-card"),
				words: this.querySelectorAll(".kf-hero-3-title-sub, .kf-hero-3-title-name, .kf-hero-3-title-script, .kf-hero-3-btns")
			});
		});
	}

	// the slice and the peppers drift with the cursor (kfHero3Drift), so gsap keeps their transform (it holds the css rotation too)
	function drifters(scene) {
		return [scene.slice, scene.pepper];
	}

	function still(scene) {
		return [scene.plate, scene.ring].concat(
			Array.prototype.slice.call(scene.cards),
			Array.prototype.slice.call(scene.words)
		);
	}

	// parked: nothing of the slide is on show yet
	function park(scene) {
		gsap.killTweensOf(still(scene).concat(drifters(scene)));
		gsap.set(scene.plate, { opacity: 0, rotate: 90, scale: .5 });
		gsap.set(scene.ring, { opacity: 0 });
		gsap.set(scene.slice, { opacity: 0, scale: .8 });
		gsap.set(scene.pepper, { opacity: 0, scale: .6 });
		gsap.set(scene.cards, { opacity: 0, scale: .6, y: 20 });
		gsap.set(scene.words, { opacity: 0, y: 36, filter: "blur(8px)" });
	}

	function serve(scene) {
		gsap.timeline({
			defaults: { ease: "power3.out" },
			onComplete: function () {
				gsap.set(still(scene), { clearProps: "transform,opacity,filter,transformOrigin" });
				gsap.set(drifters(scene), { clearProps: "opacity" });
			}
		})
			.to(scene.plate, { opacity: 1, rotate: 0, scale: 1, duration: 1.3 }, 0)
			.to(scene.ring, { opacity: 1, duration: 1.2 }, .4)
			.to(scene.cards, { opacity: 1, scale: 1, y: 0, duration: .9, stagger: .15 }, .9)
			.to(scene.words, { opacity: 1, y: 0, filter: "blur(0px)", duration: 1, ease: "power4.out", stagger: .15 }, 1)
			// the plate has settled by now: the slice shows first, the peppers a moment after it
			.to(scene.slice, { opacity: 1, scale: 1, duration: 1.2 }, 1.2)
			.to(scene.pepper, { opacity: scene.pepperTo, scale: 1, duration: 1.2 }, 1.4);
	}

	kfHero3Swiper = new Swiper(".kf-hero-3-slider", {
		effect: "fade",
		fadeEffect: { crossFade: true },
		speed: 800,
		initialSlide: first,
		allowTouchMove: false,
		rewind: true,
		// a slide needs about 2.5s to build up, the rest of the 6s it is on show whole
		// autoplay: {
		// 	delay: 6000,
		// 	disableOnInteraction: false,
		// },
		on: {
			slideChange: function (swiper) {
				var scene = scenes[swiper.activeIndex];

				$thumbs.removeClass("is-active").eq(swiper.activeIndex).addClass("is-active");

				if (!ready || !scene) return;

				park(scene);
				serve(scene);
			},
		},
	});

	$thumbs.on("click", function () {
		kfHero3Swiper.slideTo($thumbs.index(this));
	});

	$thumbs.on("keydown", function (e) {
		if (e.key !== "Enter" && e.key !== " ") return;

		e.preventDefault();
		kfHero3Swiper.slideTo($thumbs.index(this));
	});

	// no autoplay, the slide changes with the thumbs only; the first slide is parked now behind the preloader, afterPreloader plays it
	if (scenes.length) {
		park(scenes[first]);

		kfHero3First = {
			play: function () {
				ready = true;
				serve(scenes[first]);
			}
		};
	}
}


/*
	hero-3 drift — the slice and the peppers follow the cursor over the hero, the peppers further and the other way round, and go back
	when the cursor leaves. A proxy is tweened and the pictures are set from it, so a slide that is parked meanwhile (that kills the
	tweens of its own parts) does not stop the drift
*/
function kfHero3Drift() {
	var area = document.querySelector(".kf-hero-3-area");
	var slices = gsap.utils.toArray(".kf-hero-3-slice");
	var peppers = gsap.utils.toArray(".kf-hero-3-pepper");
	if (!area || prefersReducedMotion() || (!slices.length && !peppers.length)) return;

	var pos = { x: 0, y: 0 };

	function apply() {
		gsap.set(slices, { x: pos.x * 24, y: pos.y * 24 });
		gsap.set(peppers, { x: pos.x * -44, y: pos.y * -44 });
	}

	function follow(x, y) {
		gsap.to(pos, { x: x, y: y, duration: 1.2, ease: "power3.out", overwrite: true, onUpdate: apply });
	}

	area.addEventListener("mousemove", function (e) {
		var box = area.getBoundingClientRect();

		follow(((e.clientX - box.left) / box.width - .5) * 2, ((e.clientY - box.top) / box.height - .5) * 2);
	});

	area.addEventListener("mouseleave", function () {
		follow(0, 0);
	});
}


/*
	hero-3 decor — parked behind the preloader like the slider, played right after: the cream shape slides in from the right edge,
	the mint leaves unroll from the lower left corner, the tomato drops in from the top left and the tomatoes in the lower right
	corner rise last. They are plain pictures in the css (no transform of their own), so gsap hands them back clean
*/
var kfHero3Deco = null;

function kfHero3DecoInit() {
	if (prefersReducedMotion()) return;

	var shape = document.querySelector(".kf-hero-3-shape");
	var leaf = document.querySelector(".kf-hero-3-leaf");
	var tomato = document.querySelector(".kf-hero-3-tomato");
	var corner = document.querySelector(".kf-hero-3-corner");
	var all = [shape, leaf, tomato, corner].filter(Boolean);
	if (!all.length) return;

	gsap.set(shape, { xPercent: 30, opacity: 0 });
	gsap.set(leaf, { xPercent: -40, yPercent: 40, rotate: -30, scale: .6, opacity: 0, transformOrigin: "0% 100%" });
	gsap.set(tomato, { y: -70, rotate: -40, scale: .4, opacity: 0 });
	gsap.set(corner, { xPercent: 25, yPercent: 40, rotate: 25, scale: .6, opacity: 0, transformOrigin: "100% 100%" });

	kfHero3Deco = {
		play: function () {
			gsap.timeline({
				defaults: { ease: "power3.out" },
				onComplete: function () {
					gsap.set(all, { clearProps: "transform,opacity,transformOrigin" });
				}
			})
				.to(shape, { xPercent: 0, opacity: 1, duration: 1.6 }, 0)
				.to(leaf, { xPercent: 0, yPercent: 0, rotate: 0, scale: 1, opacity: 1, duration: 1.4 }, .3)
				.to(tomato, { y: 0, rotate: 0, scale: 1, opacity: 1, duration: 1.5, ease: "back.out(1.4)" }, .5)
				.to(corner, { xPercent: 0, yPercent: 0, rotate: 0, scale: 1, opacity: 1, duration: 1.4 }, .9);
		}
	};
}


/*
	products-1 slider — cards of a fixed width run past the edges, the line under them shows how far the slider has gone
*/
function kfProducts1Slider() {
	if (!$(".kf-products-1-slider").length) return;

	new Swiper(".kf-products-1-slider", {
		loop: true,
		slidesPerView: "auto",
		spaceBetween: 20,
		slidesOffsetBefore: 20,
		slidesOffsetAfter: 20,
		speed: 700,
		grabCursor: true,
		navigation: {
			prevEl: ".kf-products-1-btn.prev",
			nextEl: ".kf-products-1-btn.next",
		},
		pagination: {
			el: ".kf-products-1-pagination",
			type: "progressbar",
		},
	});
}


/*
	about-1 slider — two pictures that are always both on show, the one on top and the one under it swap places
	(the movement and the layer change are in the css, this only flips which one is in front)
*/
function kfAbout1Slider() {
	var $slides = $(".kf-about-1-slide");
	if ($slides.length < 2) return;

	setInterval(function () {
		$slides.toggleClass("is-front");
	}, 4000);
}


/*
	about-1 scroll motion — while the section passes, the pizza comes down from above and the round dish makes one full turn
*/
function kfAbout1Parallax() {
	var pizza = document.querySelector(".kf-about-1-parallax-img");
	var dish = document.querySelector(".kf-about-1-sm-img");
	if ((!pizza && !dish) || prefersReducedMotion()) return;

	var scrollTrigger = {
		trigger: ".kf-about-1-area",
		start: "top bottom",
		end: "bottom top",
		scrub: true
	};

	if (pizza) {
		gsap.fromTo(pizza, { y: -200 }, { y: 150, ease: "none", scrollTrigger: scrollTrigger });
	}

	if (dish) {
		gsap.fromTo(dish, { rotation: 0 }, { rotation: 360, ease: "none", scrollTrigger: scrollTrigger });
	}
}


/*
	menu-1 scroll motion — the big round dish turns with the scroll, one full turn while the section passes
*/
function kfMenu1Rotate() {
	var dish = document.querySelector(".kf-menu-1-big-img");
	if (!dish || prefersReducedMotion()) return;

	gsap.fromTo(dish, { rotation: 0 }, {
		rotation: 360,
		ease: "none",
		scrollTrigger: {
			trigger: ".kf-menu-1-area",
			start: "top bottom",
			end: "bottom top",
			scrub: true
		}
	});
}


/*
	menu-1 background pieces — the red strip at the bottom and the pizza slide up into place when they scroll into view;
	parked with a class, played by a second class (css, see _menu.scss)
*/
function kfMenu1BgIn() {
	if (prefersReducedMotion()) return;

	document.querySelectorAll(".kf-menu-1-bg-shape, .kf-menu-1-bg-img").forEach(function (el) {
		el.classList.add("is-ani");

		ScrollTrigger.create({
			trigger: el,
			start: "top 100%",
			once: true,
			onEnter: function () {
				el.classList.add("is-in");
			}
		});
	});
}


/*
	menu-1 card dishes — every round dish in the cards turns 45deg into place while it fades in, once its card scrolls
	into view; parked with a class, played by a second class (css, see _menu.scss)
*/
function kfMenu1CardImgIn() {
	if (prefersReducedMotion()) return;

	document.querySelectorAll(".kf-menu-1-card-img").forEach(function (el) {
		el.classList.add("is-ani");

		ScrollTrigger.create({
			trigger: el,
			start: "top 90%",
			once: true,
			onEnter: function () {
				el.classList.add("is-in");
			}
		});
	});
}


/*
	menu-2 tabs — every group shows the picture of the dish picked in its list; the pointer on a dish, a tap
	or the keyboard picks it
*/
function kfMenu2Tabs() {
	$(".kf-menu-2-tabs").each(function () {
		var $tabs = $(this).find(".kf-menu-2-tab");
		var $imgs = $(this).find(".kf-menu-2-tabs-img");

		$tabs.on("click mouseenter focus", function () {
			if ($(this).hasClass("is-active")) return;

			$tabs.removeClass("is-active").attr("aria-selected", "false");
			$(this).addClass("is-active").attr("aria-selected", "true");
			$imgs.removeClass("is-active").eq($tabs.index(this)).addClass("is-active");
		});
	});
}


/*
	menu-2 title lines — each line is drawn when it comes into view: the left flower is drawn in outline and then filled,
	the dashed line grows out of it and the right flower is drawn at its end. The flowers are <use> of one symbol in the
	hidden svg (kf-menu-2-defs) whose paths have pathLength="1", so a dash of 1 is a whole outline; stroke and dash
	properties are inherited from the svg of each flower into the symbol
*/
function kfMenu2Orn() {
	if (!$(".kf-menu-2-tabs-orn").length || prefersReducedMotion()) return;

	document.querySelectorAll(".kf-menu-2-tabs-orn").forEach(function (orn) {
		var flowers = orn.querySelectorAll(".flower");
		var line = orn.querySelector(".line");

		// parked: nothing of the flowers is there until the outline is drawn (the gap is longer than the line, no dot at the ends)
		gsap.set(flowers, { stroke: "currentColor", strokeWidth: 1, strokeDasharray: "1 2", strokeDashoffset: 1, strokeOpacity: 1, fillOpacity: 0 });
		gsap.set(line, { scaleX: 0, transformOrigin: "left center" });

		var tl = gsap.timeline({
			scrollTrigger: {
				trigger: orn,
				start: "top 88%",
				once: true
			},
			onComplete: function () {
				gsap.set(flowers, { clearProps: "stroke,strokeWidth,strokeDasharray,strokeDashoffset,strokeOpacity,fillOpacity" });
				gsap.set(line, { clearProps: "transform" });
			}
		});

		flowers.forEach(function (flower, i) {
			var at = i * 1.5;
			tl.to(flower, { strokeDashoffset: 0, duration: 1.1, ease: "power2.inOut" }, at)
				.to(flower, { fillOpacity: 1, strokeOpacity: 0, duration: .6, ease: "power1.out" }, at + .8);
		});

		tl.to(line, { scaleX: 1, duration: 1.2, ease: "power2.inOut" }, .5);
	});
}


/*
	opening-1 parallax — the photo is taller than its frame and runs against the scroll: while the frame passes
	through the screen it slides down inside it, so the picture seems to sit deeper than the page
*/
function kfOpening1Parallax() {
	var photo = document.querySelector(".kf-opening-1-photo");
	if (!photo || prefersReducedMotion()) return;

	gsap.fromTo(photo, { yPercent: -12 }, {
		yPercent: 12,
		ease: "none",
		scrollTrigger: {
			trigger: ".kf-opening-1-img",
			start: "top bottom",
			end: "bottom top",
			scrub: true
		}
	});
}


/*
	offers-2 parallax — the dish picture is taller than its frame and runs against the scroll: while the section passes
	through the screen it slides down inside the frame, so it seems to lie deeper than the content
*/
function kfOffers2Parallax() {
	var dish = document.querySelector(".kf-offers-2-img-in");
	if (!dish || prefersReducedMotion()) return;

	// 11% of the 130% tall picture is 14.3% of its frame, just under the 15% it hangs over each edge
	gsap.fromTo(dish, { yPercent: -11 }, {
		yPercent: 11,
		ease: "none",
		scrollTrigger: {
			trigger: ".kf-offers-2-area",
			start: "top bottom",
			end: "bottom top",
			scrub: true
		}
	});
}


/*
	products-2 line drawing — the chef is drawn like with a pen when it comes into view: its strokes (one path each, inline
	in the html) are drawn one after another, each for as long as it is, so the pen has the same speed everywhere
*/
function kfProducts2VectorDraw() {
	var box = document.querySelector(".kf-products-2-bg-vector");
	if (!box || prefersReducedMotion()) return;

	var paths = box.querySelectorAll("path");
	// it is hidden on small screens (display: none) and a hidden path cannot be measured, so it just stays whole there
	if (!paths.length || !box.getClientRects().length) return;

	var lengths = [];
	var total = 0;
	paths.forEach(function (path) {
		var length = path.getTotalLength();
		lengths.push(length);
		total += length;
	});

	var duration = 4;
	var at = 0;
	var tl = gsap.timeline({
		scrollTrigger: {
			trigger: box,
			start: "top 85%",
			once: true
		},
		onComplete: function () {
			gsap.set(paths, { clearProps: "strokeDasharray,strokeDashoffset" });
		}
	});

	paths.forEach(function (path, i) {
		var length = lengths[i];

		// the gap is a little longer than the line, so a round cap does not leave a dot at the end before the line comes
		gsap.set(path, { strokeDasharray: length + " " + (length + 4), strokeDashoffset: length + 2 });

		var time = duration * length / total;
		tl.to(path, { strokeDashoffset: 0, duration: time, ease: "none" }, at);
		at += time;
	});
}


/*
	background drift (home-2) — the decorative pictures marked data-kf-drift="40" run against the scroll: while their
	section passes through the screen they slide from -40px to +40px (the number is the distance), so they lie a little
	deeper than the content. Only for pictures that have no transform of their own in the css
*/
function kfBgDrift() {
	if (prefersReducedMotion()) return;

	gsap.utils.toArray("[data-kf-drift]").forEach(function (el) {
		var distance = parseFloat(el.getAttribute("data-kf-drift")) || 40;

		gsap.fromTo(el, { y: -distance }, {
			y: distance,
			ease: "none",
			scrollTrigger: {
				trigger: el.closest("section") || el,
				start: "top bottom",
				end: "bottom top",
				scrub: true
			}
		});
	});
}


/*
	choose-1 sliders — the picture slider leads: its arrows also move the text slider and the number
*/
function kfChoose1Slider() {
	if (!$(".kf-choose-1-img-slider").length) return;

	var $current = $(".kf-choose-1-control .current");

	var text = new Swiper(".kf-choose-1-content-slider", {
		effect: "fade",
		fadeEffect: { crossFade: true },
		speed: 700,
		allowTouchMove: false,
	});

	new Swiper(".kf-choose-1-img-slider", {
		grabCursor: true,
		effect: "creative",
		creativeEffect: {
			prev: {
				shadow: true,
				origin: "left center",
				translate: ["-5%", 0, -200],
				rotate: [0, 100, 0],
			},
			next: {
				origin: "right center",
				translate: ["5%", 0, -200],
				rotate: [0, -100, 0],
			},
		},
		speed: 900,
		autoplay: {
			delay: 4000,
			disableOnInteraction: false,
		},
		navigation: {
			prevEl: ".kf-choose-1-btn.prev",
			nextEl: ".kf-choose-1-btn.next"
		},
		on: {
			slideChange: function (swiper) {
				text.slideTo(swiper.activeIndex);
				$current.text(("0" + (swiper.activeIndex + 1)).slice(-2));
			}
		}
	});
}


/*
	choose-2 — when it scrolls into view the two brush halves of the plate slide out of the middle line, then the dish
	comes up between them; the circle draws itself from the top down and each reason pops up when the line reaches its
	dot (parked with a class, played by a second class — css, see _choose.scss). Below 1200px there is no circle, so the
	reasons come one after another as they scroll into view
*/
function kfChoose2In() {
	var area = document.querySelector(".kf-choose-2-area");
	if (!area || prefersReducedMotion()) return;

	var plate = area.querySelector(".kf-choose-2-plate");
	var plateParts = plate.querySelectorAll(".kf-choose-2-plate-bg-1, .kf-choose-2-plate-bg-2, .kf-choose-2-plate-img");
	var rings = area.querySelector(".kf-choose-2-rings");
	var items = area.querySelectorAll(".kf-choose-2-item");
	var wide = window.matchMedia("(min-width: 1200px)");
	var shown = false;

	function park(el) {
		el.classList.add("is-ani");
	}

	function play(el) {
		el.classList.add("is-in");
	}

	plateParts.forEach(park);
	park(rings);
	items.forEach(park);

	ScrollTrigger.create({
		trigger: plate,
		start: "top 95%",
		once: true,
		onEnter: function () {
			shown = true;
			plateParts.forEach(play);
			play(rings);

			// with the circle the reasons follow the line, their delays are in the css
			if (wide.matches) items.forEach(play);
		}
	});

	items.forEach(function (item) {
		ScrollTrigger.create({
			trigger: item,
			start: "top 90%",
			once: true,
			onEnter: function () {
				if (!wide.matches || shown) play(item);
			}
		});
	});
}


/*
	faqs-2 pizza — when it scrolls into view the picture grows from nothing on its lower right corner while it slides up
	(parked with a class, played by a second class — css, see _faqs.scss). The frame is the trigger, it never moves
*/
function kfFaqs2ImgIn() {
	var frame = document.querySelector(".kf-faqs-2-img");
	var img = document.querySelector(".kf-faqs-2-img-in");
	if (!frame || !img || prefersReducedMotion()) return;

	img.classList.add("is-ani");

	ScrollTrigger.create({
		trigger: frame,
		start: "top 65%",
		once: true,
		onEnter: function () {
			img.classList.add("is-in");
		}
	});
}


/*
	offers-2 counter — the numbers run down to the date in data-countdown (the ones in the html show until the script starts)
*/
function kfOffers2Countdown() {
	var box = document.querySelector(".kf-offers-2-counter-box");
	if (!box) return;

	var end = new Date(box.getAttribute("data-countdown")).getTime();
	if (isNaN(end)) return;

	var days = box.querySelector('[data-unit="days"]');
	var hours = box.querySelector('[data-unit="hours"]');
	var mins = box.querySelector('[data-unit="mins"]');
	var secs = box.querySelector('[data-unit="secs"]');

	function pad(n) {
		return ("0" + n).slice(-2);
	}

	function tick() {
		var left = Math.max(0, end - Date.now());

		days.textContent = Math.floor(left / 864e5);
		hours.textContent = pad(Math.floor(left % 864e5 / 36e5));
		mins.textContent = pad(Math.floor(left % 36e5 / 6e4));
		secs.textContent = pad(Math.floor(left % 6e4 / 1e3));
	}

	tick();
	setInterval(tick, 1000);
}


/*
	testimonial-1 slider — the portrait and the words fade into the next ones, the dots show which one is on
*/
function kfTestimonial1Slider() {
	if (!$(".kf-testimonial-1-slider").length) return;

	new Swiper(".kf-testimonial-1-slider", {
		effect: "fade",
		fadeEffect: { crossFade: true },
		speed: 800,
		// without a loop the autoplay would stop on the last slide, rewind sends it back to the first
		rewind: true,
		autoplay: {
			delay: 5000,
			disableOnInteraction: false
		},
		pagination: {
			el: ".kf-testimonial-1-pagination",
			clickable: true
		}
	});
}


/*
	testimonial-2 slider — pictures and cards are slides of different widths, so it shows as many as fit and the next one
	is cut by the edge of the page; it loops and plays by itself (stops while the pointer is on it), the dots show where it
	is and can be clicked
*/
function kfTestimonial2Slider() {
	if (!$(".kf-testimonial-2-slider").length) return;

	new Swiper(".kf-testimonial-2-slider", {
		slidesPerView: "auto",
		spaceBetween: 12,
		grabCursor: true,
		speed: 700,
		loop: true,
		// the last slide at the right edge is cut, two more copies keep the row full there
		loopAdditionalSlides: 2,
		autoplay: {
			delay: 4000,
			disableOnInteraction: false,
			pauseOnMouseEnter: true
		},
		pagination: {
			el: ".kf-testimonial-2-pagination",
			clickable: true
		}
	});
}


/*
	order-2 meal tabs — Starter / Lunch / Dinner: the one picked turns dark and its name goes to the hidden field of the form
*/
function kfOrder2Tabs() {
	$(".kf-order-2-tabs").each(function () {
		var $tabs = $(this).find(".kf-order-2-tab");
		var $meal = $(this).closest(".kf-order-2-form").find("input[name='meal']");

		$tabs.on("click", function () {
			$tabs.removeClass("is-active").attr("aria-pressed", "false");
			$(this).addClass("is-active").attr("aria-pressed", "true");
			$meal.val($(this).data("meal"));
		});
	});
}


/*
	testimonial-1 big word — like the big title of outgrid (service-v1-title): while the page scrolls the letters rise from
	below one after the other (0.4s each, 0.2s apart, power2.out, scrubbed 1.5), fading in on the way so nothing is cut off
	by a hard edge, and the whole word slides in from the right (40% -> 0). The filled word and the outline word move
	together; from 992px up only
*/
function kfTestimonial1BgText() {
	var texts = document.querySelectorAll(".kf-testimonial-1-bg-text");
	if (!texts.length || prefersReducedMotion()) return;

	gsap.matchMedia().add("(min-width: 992px)", function () {
		var splits = [];
		var tl = gsap.timeline({
			scrollTrigger: {
				trigger: texts[0],
				start: "top bottom",
				end: "bottom 50%",
				scrub: 1.5
			}
		});

		tl.fromTo(texts, { xPercent: 40 }, { xPercent: 0, duration: 1.6, ease: "none" }, 0);

		texts.forEach(function (text) {
			var split = new SplitText(text, { type: "chars" });
			splits.push(split);
			tl.fromTo(split.chars, { yPercent: 200, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.4, ease: "power2.out", stagger: 0.2 }, 0);
		});

		return function () {
			splits.forEach(function (split) {
				split.revert();
			});
		};
	});
}


/*
	footer-1 / footer-2 big title — the word is served: the letters come up from behind the line one after another like
	dishes from the pass, each one clearing from a blur (steam) as it lands. They go from the first letter to the last,
	or (from: "center") start with the middle one and go out to both sides
*/
function kfFooterBigTitle(titleSelector, triggerSelector, from) {
	var title = document.querySelector(titleSelector);
	if (!title || prefersReducedMotion()) return;

	var letters = title.querySelectorAll("span");

	gsap.fromTo(letters, {
		yPercent: 120,
		opacity: 0,
		filter: "blur(12px)"
	}, {
		yPercent: 0,
		opacity: 1,
		filter: "blur(0px)",
		duration: 1.3,
		ease: "power3.out",
		stagger: { each: .1, from: from || "start" },
		scrollTrigger: {
			trigger: triggerSelector,
			start: "top 92%",
			once: true
		},
		onComplete: function () {
			gsap.set(letters, { clearProps: "opacity,filter,transform" });
		}
	});
}


/*
	footer-1 photos — every tile is a covered dish: a lid with a gold rim and a knob lifts off it, tile after tile, while
	the photo settles from a closer view; the lids are made here, so without the script (or with reduced motion) the
	photos are simply there. The photos have a css transition for the hover, which is switched off while gsap moves them
*/
function kfFooter1Images() {
	var box = document.querySelector(".kf-footer-1-img-box");
	if (!box || prefersReducedMotion()) return;

	var photos = box.querySelectorAll(".kf-footer-1-img-photo");
	var lids = [];

	box.querySelectorAll(".kf-footer-1-img-item").forEach(function (tile) {
		var lid = document.createElement("div");
		lid.className = "kf-footer-1-img-lid";
		tile.appendChild(lid);
		lids.push(lid);
	});

	gsap.set(photos, { transition: "none", scale: 1.25 });

	gsap.timeline({
		scrollTrigger: {
			trigger: box,
			start: "top 85%",
			once: true
		},
		onComplete: function () {
			gsap.set(photos, { clearProps: "transition,transform" });
			lids.forEach(function (lid) {
				lid.remove();
			});
		}
	})
		.to(lids, { yPercent: -101, duration: 1.1, ease: "power3.inOut", stagger: .14 }, 0)
		.to(photos, { scale: 1, duration: 1.6, ease: "power2.out", stagger: .14 }, 0);
}


/*
	hero-1 (AI Agentech) — like the slider of the KingFeast hero: the picture of the new slide opens like an iris (a circle that grows from
	the middle of the stage, a thin ring runs on its edge) and settles from a zoom, the robot comes in out of a blur, then the words of the
	title come up from behind their line one after another and the text and the button follow. The counter and the thumbnails follow the
	active slide, a click on a thumbnail jumps to its slide. The first slide opens right after the preloader and the slides go on by themselves
*/
var agHero1First = null;
var agHero1Swiper = null;

function agHero1Slider() {

	if (!$(".ag-hero-1-slider").length) return;

	var slider = document.querySelector(".ag-hero-1-slider");
	var backSlides = slider.querySelectorAll(".ag-hero-1-slider-back .swiper-slide");
	var $thumbs = $(".ag-hero-1-thumb");
	var $current = $(".ag-hero-1-count .current");
	var scenes = [];
	var rim = null;

	if (!prefersReducedMotion()) {
		$(".ag-hero-1-slider-front .swiper-slide").each(function (i) {
			var title = this.querySelector(".ag-hero-1-title");

			scenes.push({
				back: backSlides[i],
				bg: backSlides[i].querySelector(".ag-hero-1-bg img"),
				robot: this.querySelector(".ag-hero-1-main img"),
				words: title ? kfHeroWords(title, "ag-hero-1-word-mask", "ag-hero-1-word") : [],
				rest: Array.prototype.slice.call(this.querySelectorAll(".ag-hero-1-text, .ag-pr-btn-1")),
				tl: null
			});
		});

		rim = document.createElement("div");
		rim.className = "ag-hero-1-rim";
		slider.appendChild(rim);
		gsap.set(rim, { autoAlpha: 0 });
	}

	// parked: the picture is closed (a circle of nothing), the robot and the text wait for their turn
	function park(scene) {
		if (scene.tl) scene.tl.kill();

		// the button has a css transition for its hover, it would lag behind gsap
		gsap.set(scene.rest, { transition: "none", y: 28, opacity: 0, filter: "blur(6px)" });
		gsap.set(scene.words, { yPercent: 115, rotate: 5, opacity: 0, filter: "blur(10px)", transformOrigin: "0% 100%" });
		gsap.set(scene.robot, { y: 70, scale: .82, opacity: 0, filter: "blur(14px)", transformOrigin: "50% 100%" });
		gsap.set(scene.bg, { scale: 1.2 });
		scene.back.style.clipPath = "circle(0px at 50% 58%)";
	}

	function serve(scene) {
		var targets = [scene.bg, scene.robot].concat(scene.words, scene.rest);
		var iris = { r: 0 };
		// the circle opens at 50% 58% and has to reach the farthest corner
		var reach = Math.hypot(slider.clientWidth / 2, slider.clientHeight * .58) + 10;

		scene.tl = gsap.timeline({
			defaults: { ease: "power3.out" },
			onComplete: function () {
				scene.back.style.clipPath = "";
				Array.prototype.forEach.call(backSlides, function (slide) {
					slide.classList.remove("is-leaving");
				});
				gsap.set(targets, { clearProps: "transform,opacity,filter,transition" });
			}
		})
			.to(iris, {
				r: reach,
				duration: 1.5,
				ease: "power3.inOut",
				onUpdate: function () {
					scene.back.style.clipPath = "circle(" + iris.r + "px at 50% 58%)";
					rim.style.width = rim.style.height = iris.r * 2 + "px";
				}
			}, 0)
			.fromTo(rim, { autoAlpha: 0 }, { autoAlpha: 1, duration: .2 }, 0)
			.to(rim, { autoAlpha: 0, duration: .3 }, 1.2)
			.to(scene.bg, { scale: 1, duration: 2, ease: "power2.out" }, 0)
			.to(scene.robot, { y: 0, scale: 1, opacity: 1, filter: "blur(0px)", duration: 1.4 }, .5)
			// the words wait until the circle has reached the text
			.to(scene.words, { yPercent: 0, rotate: 0, opacity: 1, filter: "blur(0px)", duration: 1.2, ease: "power4.out", stagger: .08 }, .9)
			.to(scene.rest, { y: 0, opacity: 1, filter: "blur(0px)", duration: 1, stagger: .15 }, 1.25);
	}

	// the pictures behind only follow the front one (the ghost title sits between the two); which of them shows is set below (is-current)
	var back = new Swiper(".ag-hero-1-slider-back", {
		slidesPerView: 1,
		speed: 1000,
		allowTouchMove: false,
		effect: "fade",
		fadeEffect: { crossFade: true }
	});

	var swiper = new Swiper(".ag-hero-1-slider-front", {
		slidesPerView: 1,
		speed: 1000,
		rewind: true,
		effect: "fade",
		fadeEffect: { crossFade: true },
		controller: { control: back },
		autoplay: prefersReducedMotion() ? false : { delay: 5000, disableOnInteraction: false },
		on: {
			slideChange: function () {
				var now = this.activeIndex;
				var before = this.previousIndex;

				$thumbs.removeClass("is-active").eq(now).addClass("is-active");
				$current.text("0" + (now + 1));

				// the picture that goes out stays under the new one until the circle has covered it
				Array.prototype.forEach.call(backSlides, function (slide, n) {
					slide.classList.toggle("is-current", n === now);
					slide.classList.toggle("is-leaving", n === before);
				});

				if (!scenes.length) return;

				// a slide that is still opening when it is left is shown whole, it goes out under the new one
				if (scenes[before]) {
					if (scenes[before].tl) scenes[before].tl.kill();
					scenes[before].back.style.clipPath = "";
				}

				park(scenes[now]);
				serve(scenes[now]);
			}
		}
	});

	$thumbs.on("click", function () {
		swiper.slideTo($thumbs.index(this));
	}).on("keydown", function (e) {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			swiper.slideTo($thumbs.index(this));
		}
	});

	// the slider waits behind the preloader: the first slide is parked now, afterPreloader opens it and starts the slider
	agHero1Swiper = swiper;

	if (scenes.length) {
		swiper.autoplay.stop();
		park(scenes[0]);

		agHero1First = {
			play: function () {
				serve(scenes[0]);
			}
		};
	}
}


/*
	services-1 (AI Agentech) — the cards drag along the slider, the card under the pointer (or the focus) is the lit one,
	the second card starts lit as drawn in the design
*/
function agServices1Slider() {

	if (!$(".ag-services-1-slider").length) return;

	new Swiper(".ag-services-1-slider", {
		slidesPerView: "auto",
		spaceBetween: 20,
		speed: 600,
		grabCursor: true
	});

	var $cards = $(".ag-services-1-card");

	$cards.on("mouseenter focusin", function () {
		$cards.removeClass("is-active");
		$(this).addClass("is-active");
	});
}


/*
	team-1 (AI Agentech) — the card under the pointer (or the focus) is the lit one, the second card starts lit as drawn in the design
*/
function agTeam1Cards() {

	var $cards = $(".ag-team-1-card");

	if (!$cards.length) return;

	$cards.on("mouseenter focusin", function () {
		$cards.removeClass("is-active");
		$(this).addClass("is-active");
	});
}


/*
	features-1 (AI Agentech) — the slider has one picture for every item of the list: the item under the pointer (or the focus) is
	the lit one and brings its picture, a swipe on the slider lights the item of the picture that comes
*/
function agFeatures1Slider() {

	if (!$(".ag-features-1-slider").length) return;

	var $items = $(".ag-features-1-item");

	var swiper = new Swiper(".ag-features-1-slider", {
		slidesPerView: 1,
		spaceBetween: 2,
		speed: 700,
		grabCursor: true,
		on: {
			slideChange: function () {
				$items.removeClass("is-active").eq(this.activeIndex).addClass("is-active");
			}
		}
	});

	$items.on("mouseenter focusin", function () {
		swiper.slideTo($items.index(this));
	});
}


/*
	projects-1 (AI Agentech) — the cards run past both edges of the screen, the one in the middle is the lit one (the two next to it are
	grey and see-through, css), the arrows turn the slider and a click on a card next to it brings that card to the middle
*/
function agProjects1Slider() {

	if (!$(".ag-projects-1-slider").length) return;

	new Swiper(".ag-projects-1-slider", {
		slidesPerView: "auto",
		centeredSlides: true,
		spaceBetween: 16,
		initialSlide: 1,
		loop: true,
		speed: 700,
		grabCursor: true,
		slideToClickedSlide: true,
		breakpoints: {
			768: { spaceBetween: 24 },
			1200: { spaceBetween: 40 }
		},
		navigation: {
			prevEl: ".ag-projects-1-btn.prev",
			nextEl: ".ag-projects-1-btn.next"
		}
	});
}


/*
	testimonial-1 (AI Agentech) — the cards run out to both edges of the screen, the first one starts cut by the left edge (slidesOffsetBefore,
	the less room the less is cut), they loop and play by themselves (stop while the pointer is on them) and drag
*/
function agTestimonial1Slider() {

	if (!$(".ag-testimonial-1-slider").length) return;

	new Swiper(".ag-testimonial-1-slider", {
		slidesPerView: "auto",
		spaceBetween: 16,
		slidesOffsetBefore: 36,
		loop: true,
		loopAdditionalSlides: 2,
		speed: 700,
		grabCursor: true,
		autoplay: prefersReducedMotion() ? false : { delay: 4000, disableOnInteraction: false, pauseOnMouseEnter: true },
		breakpoints: {
			768: { spaceBetween: 20, slidesOffsetBefore: 48 },
			992: { slidesOffsetBefore: 60 },
			1200: { slidesOffsetBefore: -60 },
			1400: { slidesOffsetBefore: -120 },
			1600: { slidesOffsetBefore: -202 }
		}
	});
}


/*
	team-1 scroll — like the team of kaelorian: from 1200px up the section is pinned and the cards slide in from the right edge of their
	box (.ag-team-1-overflow, it cuts them off) while the page scrolls (the row as a block, every card a little behind the one before it,
	scrubbed 0.6), then they rest for a moment and the page goes on. The top of the section comes up once when it arrives.
	Below 1200 there is no animation at all
*/
function agTeam1Scroll() {

	var area = document.querySelector(".ag-team-1-area");
	if (!area || prefersReducedMotion()) return;

	var top = area.querySelector(".ag-team-1-top");
	var box = area.querySelector(".ag-team-1-overflow");
	var row = area.querySelector(".ag-team-1-cards");
	var cards = gsap.utils.toArray(".ag-team-1-card", area);

	var mm = gsap.matchMedia();

	mm.add("(min-width: 1200px) and (min-height: 700px)", function () {
		// the pinned section fills the screen (see _team.scss), a section that is taller than the screen is pinned by its bottom edge
		area.classList.add("has-pin");

		gsap.from(top, {
			y: 60,
			opacity: 0,
			duration: 1,
			ease: "power3.out",
			scrollTrigger: { trigger: area, start: "top 75%", once: true }
		});

		var tl = gsap.timeline({
			scrollTrigger: {
				trigger: area,
				start: function () {
					return area.offsetHeight > window.innerHeight ? "bottom bottom" : "top top";
				},
				end: "+=150%",
				pin: true,
				scrub: 0.6,
				anticipatePin: 1,
				invalidateOnRefresh: true,
				// measured before the other triggers: the wa_text_effect titles under the section (main-common.js) are made before this pin,
				// so without it they do not count the space it adds and play a screen and a half before their title comes
				refreshPriority: 1
			}
		});

		tl.fromTo(row, {
			x: function () {
				return box.offsetWidth;
			}
		}, {
			x: 0,
			duration: 0.8,
			ease: "none"
		}, 0);

		tl.fromTo(row, { opacity: 0 }, { opacity: 1, duration: 0.06, ease: "none" }, 0);

		tl.fromTo(cards, {
			x: function (i) {
				return i * 120;
			}
		}, {
			x: 0,
			duration: 0.8,
			ease: "power1.out"
		}, 0);

		// the cards rest where they are for the last fifth of the pin
		tl.to({}, { duration: 0.2 });

		return function () {
			area.classList.remove("has-pin");
		};
	});
}


/*
	page lifecycle
*/
function afterPreloader() {
	// hero-1 card stack — the two cards under the top one fade down into place (css, see _hero.scss)
	$(".kf-hero-1-area").addClass("is-ready");

	kfHero1Play();
	if (kfHero1Swiper) kfHero1Swiper.autoplay.start();
	if (kfHero2First) kfHero2First.play();
	if (kfHero2Swiper) kfHero2Swiper.autoplay.start();
	if (kfHero3First) kfHero3First.play();
	if (kfHero3Deco) kfHero3Deco.play();
	if (agHero1First) agHero1First.play();
	if (agHero1Swiper && !prefersReducedMotion()) agHero1Swiper.autoplay.start();

	// the titles that waited behind the curtain (wa_text_effect with data-wa-text-wait, see main-common.js) come in now
	(window.waTextEffectWaiting || []).forEach(function (tl) {
		tl.play();
	});
}

function afterPageLoad() {
	if ($(".wow").length) {
		new WOW({
			boxClass: "wow",
			animateClass: "animated",
			offset: 100,
			mobile: true,
			live: true
		}).init();
	}
}

window.addEventListener("load", function () {

	ScrollTrigger.refresh();

	// park the hero while the curtain is still up
	kfHero1Park();

	if (agPreloader) {
		agPreloader.done();
	} else {
		afterPreloader();
	}

	afterPageLoad();
});

// a trigger on a timeline (wa_text_effect in main-common.js, menu-2 orn) is measured a moment after it is made; when the page is
// reloaded halfway down, the next trigger that is made would measure and kill the passed ones all at once and ScrollTrigger
// loses count (reading 'pin' of undefined), so they are measured first
ScrollTrigger.refresh();

kfHero1Slider();
kfHero2Slider();
kfHero3Slider();
kfHero3DecoInit();
kfHero3Drift();
kfProducts1Slider();
kfAbout1Slider();
kfAbout1Parallax();
kfMenu1Rotate();
kfMenu1BgIn();
kfMenu1CardImgIn();
kfMenu2Tabs();
kfMenu2Orn();
ScrollTrigger.refresh();
kfOpening1Parallax();
kfChoose1Slider();
kfChoose2In();
kfFaqs2ImgIn();
kfOffers2Countdown();
kfOffers2Parallax();
kfBgDrift();
kfProducts2VectorDraw();
kfTestimonial1Slider();
kfTestimonial2Slider();
kfOrder2Tabs();
kfTestimonial1BgText();
kfFooterBigTitle(".kf-footer-1-name-text", ".kf-footer-1-big-title");
kfFooterBigTitle(".kf-footer-2-name-text", ".kf-footer-2-big-title", "center");
kfFooter1Images();
agHero1Slider();
agServices1Slider();
agTeam1Cards();
agTeam1Scroll();
agFeatures1Slider();
agProjects1Slider();
agTestimonial1Slider();

})(jQuery);
