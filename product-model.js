const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var Review = require('./review-model');

const ProductSchema = new Schema(
  {
    id: Number,
    name: String,
    description: String,
    photo:String,
    photos:[String],
    price:Number,
    cat_id: Number,
    cat_name: String,
    seller_id:Number,
    purchaser_id:Number,
    seller_id:Number,
    deleted_at:Number,
  },
  { 
  	timestamps: true,
  	toJSON: { virtuals: true }
  }
);

ProductSchema.virtual('review', {
  ref: 'Review', // The model to use
  localField: 'id', 
  foreignField: 'prod_id', 
  justOne: true,
});


module.exports = mongoose.model('Product', ProductSchema);