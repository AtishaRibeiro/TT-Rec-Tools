var REGIONS = {
    0x00 : "JP",
    0x10 : "US",
    0x20 : "EU",
    0x30 : "AUS/NZ",
    0x40 : "TW",
    0x50 : "KR",
    0x60 : "CN"
};

var REGION_VALUES = {
    "JP" : 0x00,
    "US" : 0x10,
    "EU" : 0x20,
    "AUS/NZ" : 0x30,
    "TW" : 0x40,
    "KR" : 0x50,
    "CN" : 0x60
};

var TRACK_NAMES = {
    0: "LC", 1: "MMM", 2: "MG", 3: "TF",
    4: "MC", 5: "CM", 6: "DKSC", 7: "WGM",
    8: "DC", 9: "KC", 10: "MT", 11: "GV",
    12: "DDR", 13: "MH", 14: "BC", 15: "RR",
    16: "rPB", 17: "rYF", 18: "rGV2", 19: "rMR",
    20: "rSL", 21: "rSGB", 22: "rDS", 23: "rWS",
    24: "rDH", 25: "rBC3", 26: "rDKJP", 27: "rMC", 
    28: "rMC3", 29: "rPG", 30: "rDKM", 31: "rBC"
};

// track_id: (track_nr, track_index)
var TRACK_IDS = {
    0x00: [4, 4],  0x01: [1, 1],  0x02: [2, 2],  0x03: [10, 11],
    0x04: [3, 3],  0x05: [5, 5],  0x06: [6, 6],  0x07: [7, 7],
    0x08: [0, 0],  0x09: [8, 8],  0x0A: [12, 13], 0x0B: [11, 10],
    0x0C: [14, 14], 0x0D: [15, 15], 0x0E: [13, 12], 0x0F: [9, 9],
    0x10: [24, 16], 0x11: [25, 27], 0x12: [26, 23], 0x13: [27, 30],
    0x14: [28, 17], 0x15: [29, 24], 0x16: [30, 29], 0x17: [31, 22],
    0x18: [18, 28], 0x19: [17, 18], 0x1A: [21, 19], 0x1B: [20, 20],
    0x1C: [23, 31], 0x1D: [22, 26], 0x1E: [19, 25], 0x1F: [16, 21]
};

var CONTROLLERS = {
    0x0: "Wii Wheel",
    0x1: "Nunchuk",
    0x2: "Class. Controller",
    0x3: "GCN Controller",
    0x4: "USB Controller"
}

var VEHICLES = {
    0x00: "Standard Kart S",
    0x01: "Standard Kart M",
    0x02: "Standard Kart L",	
    0x03: "Baby Booster",
    0x04: "Classic Dragster",	
    0x05: "Offroader",
    0x06: "Mini Beast",
    0x07: "Wild Wing",
    0x08: "Flame Flyer",
    0x09: "Cheep Charger",	
    0x0A: "Super Blooper",
    0x0B: "Piranha Prowler",
    0x0C: "Rally Romper",
    0x0D: "Daytripper",
    0x0E: "Jetsetter",
    0x0F: "Blue Falcon",
    0x10: "Sprinter",
    0x11: "Honeycoupe",
    0x12: "Standard Bike S",
    0x13: "Standard Bike M",
    0x14: "Standard Bike L",
    0x15: "Bullet Bike",
    0x16: "Mach Bike",
    0x17: "Bowser Bike",
    0x18: "Bit Bike",
    0x19: "Sugarscoot",
    0x1A: "Wario Bike",
    0x1B: "Quacker",
    0x1C: "Zip Zip",
    0x1D: "Shooting Star",
    0x1E: "Magikruiser",
    0x1F: "Sneakster",
    0x20: "Torpedo",
    0x21: "Jet Bubble",
    0x22: "Dolphin Dasher",
    0x23: "Phantom"
}

var CHARACTERS = {
    0x00: "Mario",
    0x01: "Baby Peach",
    0x02: "Waluigi",
    0x03: "Bowser",
    0x04: "Baby Daisy",
    0x05: "Dry Bones",
    0x06: "Baby Mario",
    0x07: "Luigi",
    0x08:"Toad",
    0x09: "Donkey Kong",
    0x0A: "Yoshi",
    0x0B: "Wario",
    0x0C: "Baby Luigi",
    0x0D: "Toadette",
    0x0E: "Koopa Troopa",
    0x0F: "Daisy",
    0x10: "Peach",
    0x11: "Birdo",
    0x12: "Diddy Kong",
    0x13: "King Boo",
    0x14: "Bowser Jr.",
    0x15: "Dry Bowser",
    0x16: "Funky Kong",
    0x17: "Rosalina",
    0x18: "Small Mii Outfit A (Male)",
    0x19: "Small Mii Outfit A (Female)",
    0x1A: "Small Mii Outfit B (Male)",
    0x1B: "Small Mii Outfit B (Female)",
    0x1C: "Small Mii Outfit C (Male)",
    0x1D: "Small Mii Outfit C (Female)",
    0x1E: "Medium Mii Outfit A (Male)",
    0x1F: "Medium Mii Outfit A (Female)",
    0x20: "Medium Mii Outfit B (Male)",
    0x21: "Medium Mii Outfit B (Female)",
    0x22: "Medium Mii Outfit C (Male)",
    0x23: "Medium Mii Outfit C (Female)",
    0x24: "Large Mii Outfit A (Male)",
    0x25: "Large Mii Outfit A (Female)",
    0x26: "Large Mii Outfit B (Male)",
    0x27: "Large Mii Outfit B (Female)",
    0x28: "Large Mii Outfit C (Male)",
    0x29: "Large Mii Outfit C (Female)",
    0x2A: "Medium Mii",
    0x2B: "Small Mii",
    0x2C: "Large Mii",
    0x2D: "Peach Biker Outfit",
    0x2E: "Daisy Biker Outfit",
    0x2F: "Rosalina Biker Outfit"
}