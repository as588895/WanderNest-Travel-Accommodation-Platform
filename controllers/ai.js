const Listing = require("../models/listing.js");

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const extractBudget = (message) => {
    const matches = message.match(/(?:under|below|within|max(?:imum)?|budget(?: of)?)\s*[₹rs. ]*([\d,]+)/i);
    if (!matches) return null;
    const budget = Number(matches[1].replace(/,/g, ""));
    return Number.isFinite(budget) && budget > 0 ? budget : null;
};

const extractDestination = (message) => {
    const matches = message.match(/(?:in|at|near|for)\s+([a-z][a-z ]{2,30})(?:\s+(?:under|below|within|for|with)\b|[?.!,]|$)/i);
    return matches ? matches[1].trim() : "";
};

const findMatchingListings = async (message) => {
    const budget = extractBudget(message);
    const destination = extractDestination(message);
    const query = {};

    if (budget) query.price = { $lte: budget };
    if (destination) {
        const regex = new RegExp(escapeRegex(destination), "i");
        query.$or = [
            { title: regex },
            { description: regex },
            { location: regex },
            { country: regex },
            { category: regex },
        ];
    }

    let listings = await Listing.find(query).select("title description price location country category image").limit(6);
    if (!listings.length && (budget || destination)) {
        listings = await Listing.find({}).select("title description price location country category image").limit(6);
    }

    return { listings, budget, destination };
};

const formatListings = (listings) => listings.map((listing) => ({
    id: listing._id.toString(),
    title: listing.title,
    description: listing.description || "Comfortable stay",
    price: listing.price,
    location: listing.location,
    country: listing.country,
    category: listing.category || "Stay",
}));

const fallbackReply = ({ listings, budget, destination, message }) => {
    if (listings.length) {
        const heading = destination
            ? `Here are some WanderNest stays near ${destination}${budget ? ` under ₹${budget.toLocaleString("en-IN")}` : ""}:`
            : "Here are some stays from WanderNest that may suit your trip:";
        const options = listings.map((listing) =>
            `• ${listing.title} - ₹${Number(listing.price || 0).toLocaleString("en-IN")}/night in ${listing.location}, ${listing.country}`
        ).join("\n");
        return `${heading}\n${options}\n\nOpen any property to see its details and booking options.`;
    }

    if (/plan|itinerary|trip|days?/i.test(message)) {
        return "Tell me your destination, number of days, and approximate budget. I will suggest stays from WanderNest and a simple day-by-day plan.";
    }

    return "I can help you find a stay by destination, budget, category, or trip length. Try: Suggest a stay in Goa under ₹5000.";
};

const askModel = async (message, listings) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return null;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: process.env.OPENAI_MODEL || "gpt-4o-mini",
            temperature: 0.4,
            messages: [
                {
                    role: "system",
                    content: "You are WanderNest AI, a concise and friendly travel assistant. Recommend only properties present in the supplied JSON. Never invent listing names, prices, availability, amenities, weather, or booking promises. If the request cannot be answered from the properties, ask one short clarifying question.",
                },
                {
                    role: "user",
                    content: `User request: ${message}\n\nWanderNest properties:\n${JSON.stringify(formatListings(listings))}`,
                },
            ],
        }),
    });

    if (!response.ok) throw new Error(`AI provider returned ${response.status}`);
    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
};

module.exports.chat = async (req, res) => {
    const message = String(req.body?.message || "").trim();
    if (!message) return res.status(400).json({ error: "Please enter a message." });
    if (message.length > 500) return res.status(400).json({ error: "Please keep your message under 500 characters." });

    const search = await findMatchingListings(message);
    let reply;
    try {
        reply = await askModel(message, search.listings);
    } catch (error) {
        console.error("AI assistant error:", error.message);
    }

    res.json({
        reply: reply || fallbackReply({ ...search, message }),
        listings: formatListings(search.listings),
    });
};
