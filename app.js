//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
//import mongoose
const mongoose = require("mongoose");
const app = express();
const _ = require("lodash");


app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//create a new db inside mongoose
mongoose.connect("mongodb://127.0.0.1:27017/todolistDB");

const dbName = "todolistDB";
//create new items schema (items schema with name that has data type string)
const itemsSchema = {
  name: String
};

//new mongoose model based on schema
const Item = mongoose.model("Item", itemsSchema)

//creating 3 new documents with mongoose model
const item1 = new Item({
  name: "Welcome to your toDo list"
})
const item2 = new Item({
  name: "Hit the + button to add a new item"
})
const item3 = new Item({
  name: "<-- Hit This to delete an item"
})

//create new schema
const listSchema = {
  name: String,
  items: [itemsSchema]
};

//create mongoose model
const List = mongoose.model("List", listSchema)

//put docs into an array
const defaultItems = [ item1, item2, item3];



app.get("/", async function(req, res) {
  try {
    const foundItems = await Item.find({});

    if (foundItems.length === 0) {

      //wait for items to be inserted into db
      await Item.insertMany(defaultItems);

      //debugging console log
      console.log("Successfully saved default items to DB.");

      //redirect to home to render updated page
      res.redirect("/");

    } else {
      //render page normally
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  } catch (err) {
    console.log(err);
  }
});

app.get("/:customListName", async function(req, res){
  const customListName = _.capitalize(req.params.customListName);

  const foundList = await List.findOne({name: customListName})
  if(!foundList)
    {
      //create new list if doesn't exist
      const list = new List({
        name: customListName,
        items: defaultItems

      });
      //save to list collection
      list.save();
      res.redirect("/" + customListName)
    }
    else
    {
      //show existing list
      res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
    }




})

app.post("/", async function(req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;


  const item = new Item({
    name: itemName
  });

  if(listName === "Today")
  {
    //save new item to list
    await item.save();

    //redirect to home route to update page
    res.redirect("/");
  }
  else 
  {
    const foundList = await List.findOne({name: listName} )
    foundList.items.push(item);
    foundList.save();
    res.redirect("/" + listName);
  }
});

app.post("/delete", async function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today")
    {
      await Item.findByIdAndDelete( checkedItemId )

      console.log("successfully deleted checked item")
      res.redirect("/");
    }
    else
    {
      const foundList = await List.findOneAndUpdate(
        {name: listName}, {$pull: { items: {_id: checkedItemId}}}
      );
      res.redirect("/" + listName);
    }
    

});


app.get("/work", function(req,res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
