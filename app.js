const express = require("express");
const morgan = require("morgan");
const { pool } = require("./connection");
const app = express();
const expressLayouts = require("express-ejs-layouts");
const validator = require("validator");
const { loadContact, findDuplicate, saveContact } = require("./function");
const { query } = require("express");
const port = 5000;

app.set("view engine", "ejs");
app.use(expressLayouts);
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(express.json());
app.use((req, res, next) => {
    console.log("Time:", Date.now());
    next();
});
app.use(morgan(":method :url :status :response-time ms - :res[content-length]"));

app.get("/css/style.css", (req, res) => {
    res.end();
});

app.get("/addasync", async (req, res) => {
    try {
        const order = {
            text: "INSERT INTO contacts VALUES($1, $2, $3) RETURNING *",
            values: ["Subagja", "aryasubagja1999@gmail.com", "088222520321"],
        };
        const result = await pool.query(order);
        res.json(result);
    } catch (error) {
        console.log(error);
    }
});

// render halaman home
app.get("/", (req, res) => {
    res.render("index", {
        name: "Ramdhani Arya",
        title: "WebServer EJS",
        err: [],
        msg: "",
        page: "Home Page",
        layout: "layout/main-layout",
    });
});

// render halaman about
app.get("/about", (req, res, next) => {
    res.render("about", {
        name: "Ramdhani Arya",
        title: "WebServer EJS",
        err: [],
        msg: "",
        page: "About Page",
        layout: "layout/main-layout",
    });
    next();
});

// render halaman kontak
app.get("/contacts", (req, res) => {
    const contacts = loadContact();
    res.render("contacts", {
        name: "Ramdhani Arya",
        title: "WebServer EJS",
        err: [],
        msg: "",
        cont: contacts,
        page: "Contacts Page",
        layout: "layout/main-layout",
    });
});

// route untuk melakukan tambah kontak
app.post("/contacts/add", (req, res) => {
    // variabel penampung error
    const errDump = [];
    // ambil data inputan dari req.body
    const { name, email, mobile } = req.body;
    // cari apakah data nama inputan sudah terpakai
    const duplicate = findDuplicate(name);
    // load semua data kontak
    const contacts = loadContact();
    // jika terjadi duplikasi nama berikan error pada variabel penampung error
    if (duplicate) {
        errDump.push("Maaf, nama telah digunakan");
    }
    // validasi email
    if (email) {
        if (!validator.isEmail(email)) {
            errDump.push("Tolong masukan email yang valid");
        }
    }
    // validasi no telepon
    if (!validator.isMobilePhone(mobile, "id-ID")) {
        errDump.push("Tolong masukan no telepon yang valid");
    }
    // jika variabel penampung kesalahan berisi error maka berikan pesan kesalahan saat merender ulang halaman
    if (errDump.length > 0) {
        res.render("contacts", {
            name: "Ramdhani Arya",
            title: "WebServer EJS",
            err: errDump,
            msg: "",
            cont: contacts,
            page: "Contacts Page",
            layout: "layout/main-layout",
        });
    } else {
        // jika variabel penampung kesalahan tidak berisi error maka masukan data kedalam contact.json
        contacts.push({ name, email, mobile });
        saveContact(contacts);
        // render ulang halaman tanpa pesan kesalahan
        res.render("contacts", {
            name: "Ramdhani Arya",
            title: "WebServer EJS",
            err: [],
            msg: "Kontak berhasil ditambahkan",
            cont: contacts,
            page: "Contacts Page",
            layout: "layout/main-layout",
        });
    }
});

// route untuk melihat detail kontak sekaligus merender halaman update page
app.get("/contacts/:name", (req, res) => {
    const { name } = req.params;
    const contacts = loadContact();
    const detailContact = contacts.find((c) => c.name.toLowerCase() === name.toLowerCase());
    if (detailContact) {
        res.render("update", {
            title: "WebServer EJS",
            page: "Update Page",
            err: [],
            msg: "",
            detail: detailContact,
            layout: "layout/main-layout",
        });
    } else {
        res.redirect("/contacts");
    }
});

// route untuk melakukan update kontak
app.post("/contacts/update/:name", (req, res) => {
    // variabel penampung error
    const errDump = [];
    // ambil nama kontak dari parameter
    const { name } = req.params;
    // ambil inputan data untuk mengupdate kontak
    const { newName, email, mobile } = req.body;
    // load semua data kontak
    const contacts = loadContact();
    // cari kontak berdasarkan parameter name
    const detailContact = contacts.find((c) => c.name.toLowerCase() === name.toLowerCase());
    if (!detailContact) {
        // jika tidak ada maka kembalikan ke url sebelumnya
        res.redirect(`/contacts/${name}`);
    } else {
        // filter kontak kecuali kontak yang akan diupdate
        const updateContact = contacts.filter((c) => c.name.toLowerCase() !== name.toLowerCase());
        // cek jika inputan data nama memiliki kesamaan dengan kontak selain kontak yang akan diupdate
        const duplicate = updateContact.find((uc) => uc.name.toLowerCase() === newName.toLowerCase());
        // jika terjadi duplikasi nama berikan error pada variabel penampung error
        if (duplicate) {
            errDump.push("Nama telah digunakan");
        }
        // validasi email
        if (email) {
            if (!validator.isEmail(email)) {
                errDump.push("Tolong masukan email yang valid");
            }
        }
        // validasi no telepon
        if (!validator.isMobilePhone(mobile, "id-ID")) {
            errDump.push("Tolong masukan no yang valid");
        }
        // jika variabel penampung kesalahan berisi error maka berikan pesan kesalahan saat merender ulang halaman
        if (errDump.length > 0) {
            res.render("update", {
                title: "WebServer EJS",
                page: "Update Page",
                err: errDump,
                msg: "",
                detail: { name: newName, email, mobile },
                layout: "layout/main-layout",
            });
        } else {
            // jika variabel penampung kesalahan tidak berisi error maka masukan data kedalam contact.json
            updateContact.push({ name: newName, email, mobile });
            saveContact(updateContact);
            // redirect kedalam halaman contacts
            res.redirect("/contacts");
        }
    }
});

// route untuk melakukan hapus kontak
app.get("/contacts/delete/:name", (req, res) => {
    // ambil parameter nama kontak
    const { name } = req.params;
    // load data kontak
    const contacts = loadContact();
    // cek apakah kontak ada
    const exist = findDuplicate(name);
    if (exist) {
        // jika kontak ada lakukan filter untuk memisahkan kontak yang akan dihapus atau tidak
        const filteredContacts = contacts.filter((c) => c.name.toLowerCase() !== name.toLowerCase());
        // tulis ulang kedalam file contact.json
        saveContact(filteredContacts);
        // redirect kedalam halaman contacts
        res.redirect("/contacts");
    } else {
        // jika kontak tidak ada maka berikan pesan kontak tidak tersedia
        console.log("Maaf kontak tidak ada");
        // redirect kedalam halaman contacts
        res.redirect("/contacts");
    }
});

// menjalankan express pada port
app.listen(port, () => {
    console.log(`Server running at port: ${port}`);
});
