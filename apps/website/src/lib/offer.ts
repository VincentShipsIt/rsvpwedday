export const offerings = [
	{
		id: "weekend",
		name: "The weekend",
		kicker: "You have the house",
		from: "€8,500",
		lede: "The house is already yours. Everything that happens inside it becomes ours — the kitchen, the table, the order of the days, and every guest who needs an answer.",
		includes: [
			"Visits to the house, and the hold",
			"The chef, the menu, and a tasting you sit down for once",
			"Ceremony, dinner and the slow brunch after",
			"Flowers, the table, and the room at dusk",
			"Your guest list, their replies and where they sit",
			"The day itself, from the first car to the last song",
		],
	},
	{
		id: "all-in-one",
		name: "All in one",
		kicker: "We find it for you",
		from: "€14,000",
		lede: "We find the house as well. Everything comes from people we already work with, and you are quoted one fee before a single thing is booked.",
		includes: [
			"Everything in The weekend",
			"The house, from owners we already know",
			"Chef, florist and photographer we have worked beside for years",
			"One planning fee, then a markup on what we book — quoted up front",
		],
	},
] as const;

export const services = [
	{
		id: "venues",
		title: "Venues",
		copy: "Houses we already know how to book. We can tell you which terrace holds the light at four, and which one loses it.",
	},
	{
		id: "menu",
		title: "Menu and tasting",
		copy: "You sit down with the chef, taste the whole menu, and change your mind while changing it still costs nothing.",
	},
	{
		id: "flowers",
		title: "Flowers and the table",
		copy: "Florists we call by name. They work to the room and the season, and they arrive long before you do.",
	},
	{
		id: "photo",
		title: "Photographer",
		copy: "Someone who has photographed the house before, so nobody spends your morning hunting for the light.",
	},
	{
		id: "days",
		title: "The days",
		copy: "Ceremony, dinner, the slow brunch after. Somebody is holding the order so that you are not.",
	},
	{
		id: "guests",
		title: "Your people",
		copy: "Who is coming, what they cannot eat, where they sit. Your family answers privately, in their own language.",
	},
	{
		id: "day-of",
		title: "The day itself",
		copy: "We are there before you wake up, and you will not once see us working.",
	},
	{
		id: "music",
		title: "Music",
		copy: "A band, a DJ, or a quiet terrace and nobody telling you to dance.",
	},
] as const;

export const extras = [
	{ name: "An extra day on the weekend", note: "Quoted against the calendar" },
	{ name: "A second tasting", note: "If the first one changed your mind" },
	{ name: "The album, printed afterwards", note: "From the day, not a new shoot" },
] as const;
