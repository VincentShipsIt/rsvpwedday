export const offerings = [
	{
		id: "weekend",
		name: "The weekend",
		kicker: "We run the days",
		from: "€8,500",
		lede: "You may already have a house. We sequence the days, the kitchen, the table, the people.",
		includes: [
			"Venue visits and holds",
			"Menu and tasting with the kitchen",
			"Ceremony, dinner, brunch — in that order",
			"Guest list, replies, who sits where",
			"Flowers and the table",
			"Day-of, from the first car to the last song",
		],
	},
	{
		id: "all-in-one",
		name: "All in one",
		kicker: "We hold the house",
		from: "€14,000",
		lede: "We option the house, the kitchen, flowers and photo from our own roster. One fee, then markup on what we book.",
		includes: [
			"Everything in The weekend",
			"The house, from people we already work with",
			"Kitchen, flowers, photographer — our roster, not a marketplace",
			"One planning fee. Markup on what we book. Never a monthly bill.",
		],
	},
] as const;

export const services = [
	{
		id: "venues",
		title: "Venues",
		copy: "Houses we already know. Visits, a hold, the light at sixteen hundred.",
	},
	{
		id: "menu",
		title: "Menu and tasting",
		copy: "The kitchen, a tasting, a count that matches who is actually coming.",
	},
	{
		id: "flowers",
		title: "Flowers and the table",
		copy: "From the people we already call. Not a moodboard contest.",
	},
	{
		id: "photo",
		title: "Photographer",
		copy: "Someone who has shot the house before. A seat on the day.",
	},
	{
		id: "days",
		title: "The days",
		copy: "Ceremony, dinner, brunch. We hold the order so you do not.",
	},
	{
		id: "guests",
		title: "Your people",
		copy: "Who is coming, who eats what, who sits where. They reply in private.",
	},
	{
		id: "day-of",
		title: "Day-of",
		copy: "We are there. The cars, the kitchen, the last song.",
	},
	{
		id: "music",
		title: "Music",
		copy: "If you want it, from the same roster. If you do not, silence is a choice.",
	},
] as const;

export const extras = [
	{ name: "An extra event on the weekend", note: "Quoted against the days" },
	{ name: "A second tasting", note: "With the kitchen" },
	{ name: "Printed memories after", note: "From the album, not a new shoot" },
] as const;
