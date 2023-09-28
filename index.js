import dotenv from "dotenv";
dotenv.config();

import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import _ from "lodash";
const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
};

const itemsSchema = {
    name: String,
};

const ItemModel = mongoose.model("Item", itemsSchema);

const item1 = new ItemModel({
    name: "Welcome to your todolist!",
});

const item2 = new ItemModel({
    name: "Hit the + button to add a new a item.",
});

const item3 = new ItemModel({
    name: "<-- Hit this to delete an item.",
});

const defaultItems = [item1, item2, item3];

const customListSchema = {
    name: String,
    items: [itemsSchema],
};

const customListModel = mongoose.model("customList", customListSchema);

app.get("/", function (req, res) {
    ItemModel.find()
        .then((foundItems) => {
            if (foundItems.length === 0) {
                ItemModel.insertMany(defaultItems)
                    .then(() => {})
                    .catch((err) => {
                        console.long(err);
                    });
                res.redirect("/");
            } else {
                res.render("list", {
                    listTitle: "Today",
                    newListItems: foundItems,
                });
            }
        })
        .catch((err) => {
            console.log(err);
        });
});

app.get("/:customListName", function (req, res) {
    const customListName = _.capitalize(req.params.customListName);

    customListModel
        .findOne({ name: customListName })
        .then((foundCustomList) => {
            if (!foundCustomList) {
                const customListDocument = new customListModel({
                    name: customListName,
                    items: defaultItems,
                });
                customListDocument
                    .save()
                    .then(() => {})
                    .catch((err) => {
                        console.error(err);
                    });
                res.redirect("/" + customListName);
            } else {
                res.render("list", {
                    listTitle: foundCustomList.name,
                    newListItems: foundCustomList.items,
                });
            }
        })
        .catch((err) => {
            console.log(err);
        });
});

app.post("/", function (req, res) {
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const latestItem = new ItemModel({
        name: itemName,
    });

    if (listName === "Today") {
        latestItem
            .save()
            .then(() => {})
            .catch((err) => {
                console.error(err);
            });

        res.redirect("/");
    } else {
        customListModel
            .findOne({ name: listName })
            .then((foundList) => {
                foundList.items.push(latestItem);
                foundList
                    .save()
                    .then(() => {})
                    .catch((err) => {
                        console.error(err);
                    });
                res.redirect("/" + listName);
            })
            .catch((err) => {
                console.log(err);
            });
    }
});

app.post("/delete", function (req, res) {
    const checkedItemId = req.body.checkbox;
    const DeletedItemListName = req.body.listName;

    if (DeletedItemListName === "Today") {
        ItemModel.findByIdAndDelete(checkedItemId)
            .then(() => {
                res.redirect("/");
            })
            .catch((err) => {
                console.log(err);
            });
    } else {
        customListModel
            .findOneAndUpdate(
                { name: DeletedItemListName },
                { $pull: { items: { _id: checkedItemId } } }
            )
            .then((foundList) => {
                if (foundList) {
                    res.redirect("/" + DeletedItemListName);
                }
            })
            .catch((err) => {
                console.log(err);
            });
    }
});

app.get("/about", function (req, res) {
    res.render("about");
});

connectDB().then(() => {
    app.listen(3000, () => {
        console.log("Server started on port 3000");
    });
});
