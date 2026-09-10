export const offerings = [
	{
		id: "online",
		name: "Online only",
		kicker: "The guest site",
		from: "€2,800",
		lede: "A private website on your domain. RSVP, gifts, a memories book. We do not hold the house.",
		includes: [
			"Guest site on your domain",
			"Personal RSVP links, per event",
			"Children as counts, companions named",
			"Wish list",
			"Memories book",
			"English, German, Kurmanji",
			"Couple CMS — pages, photos, theme",
			"Invite, reminder and confirmation emails",
		],
	},
	{
		id: "weekend",
		name: "The weekend",
		kicker: "Site and sequence",
		from: "€8,500",
		lede: "The site, plus we run the calendar: ceremony, dinner, brunch. You may already have a house.",
		includes: [
			"Everything in Online only",
			"Event sequence against the real dates",
			"Headcount and meals for the kitchen",
			"Guest messaging from our console",
			"Day-of seating and a live wall",
		],
	},
	{
		id: "all-in-one",
		name: "All in one",
		kicker: "We hold the rest",
		from: "€14,000",
		lede: "We option the house, the kitchen, flowers and photo from our roster. The site is included. You do not shop a marketplace.",
		includes: [
			"Everything in The weekend",
			"Venue, kitchen, flowers, photographer from our roster",
			"One fee, then markup on what we book — never a couple subscription",
			"Languages and islands as a default, not an extra SKU",
		],
	},
] as const;

export const features = [
	{
		id: "rsvp",
		title: "Personal RSVP",
		copy: "Each household gets a link. No name search. No public guest list.",
	},
	{
		id: "events",
		title: "Per-event attendance",
		copy: "Ceremony, welcome dinner, brunch — invited separately, answered separately.",
	},
	{
		id: "children",
		title: "Children as counts",
		copy: "Under 12 are a household number, not named people. Meals without a named list.",
	},
	{
		id: "companions",
		title: "Companions",
		copy: "A plus-one is a person with an email or a phone. Not a blank seat.",
	},
	{
		id: "gifts",
		title: "Wish list",
		copy: "One gift, one household. A honeymoon night and an espresso machine are the same row.",
	},
	{
		id: "album",
		title: "Memories book",
		copy: "Guests photograph the weekend from their link. One shared book. Never a public URL.",
	},
	{
		id: "languages",
		title: "Three languages",
		copy: "English, German, Kurmanji on the site and in the mail. Per household.",
	},
	{
		id: "domain",
		title: "Your domain",
		copy: "elisajonas.com, not a subdomain of someone else’s ads.",
	},
	{
		id: "cms",
		title: "Couple CMS",
		copy: "Pages, story, gallery, FAQ, theme, opening. You edit. Guests never see /admin.",
	},
	{
		id: "mail",
		title: "Invite, remind, confirm",
		copy: "Mail that looks like the site. Test sends before anything goes to family.",
	},
	{
		id: "calendar",
		title: "Add to calendar",
		copy: "One file per event. Hidden dinners still work for the people invited.",
	},
	{
		id: "day-of",
		title: "The day",
		copy: "Seating, a live wall, a photographer seat. We run it from the studio console.",
	},
] as const;

export const extras = [
	{ name: "Extra events on the weekend", note: "Quoted against the calendar" },
	{ name: "A fourth language", note: "From €600" },
	{ name: "Live wall screens on the night", note: "Hardware + operator" },
	{ name: "Printed memories book after", note: "From the album, not a new shoot" },
] as const;
