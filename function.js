const fs = require("fs");

// menentukan lokasi file disimpan (folder dan nama file)
const path = "./data";
const file = "./data/contact.json";

// jika file tidak ada maka buat baru
if (!fs.existsSync(path)) fs.mkdirSync(path);
if (!fs.existsSync(file)) fs.writeFileSync(file, "[]");

// fungsi membaca file contact.json
const loadContact = () => {
    const data = fs.readFileSync(file, "utf-8");
    const contacts = JSON.parse(data);
    return contacts;
};

const findDuplicate = (name) => {
    const contacts = loadContact();
    return contacts.find((c) => c.name.toLowerCase() === name.toLowerCase());
};

const saveContact = (data) => {
    fs.writeFileSync(file, JSON.stringify(data));
};

module.exports = { loadContact, findDuplicate, saveContact };
