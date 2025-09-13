import React, { useState, useEffect } from "react";
import ImageHelper from "./helper/ImageHelper";
import { useNavigate } from "react-router-dom";
import { addItemToCart, removeItemFromCart } from "./helper/cartHelper";

interface CardProps {
  product: any;
  addtoCart?: boolean;
  removeFromCart?: boolean;
  setReload?: (f: any) => any;
  reload?: any;
}

const Card: React.FC<CardProps> = ({
  product,
  addtoCart = true,
  removeFromCart = false,
  setReload = (f) => f,
  //   function(f){return f}
  reload = undefined,
}) => {
  const navigate = useNavigate();
  const [count, setCount] = useState(product.count);

  const cartTitle = product ? product.name : "A photo from pexels";
  const cartDescrption = product ? product.description : "Default description";
  const cartPrice = product ? product.price : "DEFAULT";

  const addToCart = () => {
    addItemToCart(product, () => navigate("/cart"));
  };

  const showAddToCart = (addtoCart: boolean) => {
    return (
      addtoCart && (
        <button
          onClick={addToCart}
          className="btn btn-block btn-outline-success mt-2 mb-2"
        >
          Add to Cart
        </button>
      )
    );
  };

  const showRemoveFromCart = (removeFromCart: boolean) => {
    return (
      removeFromCart && (
        <button
          onClick={() => {
            removeItemFromCart(product._id);
            setReload(!reload);
          }}
          className="btn btn-block btn-outline-danger mt-2 mb-2"
        >
          Remove from cart
        </button>
      )
    );
  };
  return (
    <div className="card text-white bg2 border border-info ">
      <div className="card-header lead">{cartTitle}</div>
      <div className="card-body">
        <ImageHelper product={product} />
        <p className="lead bg1 font-weight-normal text-wrap line-clamp-2">
          {cartDescrption}
        </p>
        <p className="btn btn-success bg1 rounded  btn-sm px-4">
          $ {cartPrice}
        </p>
        <div className="row">
          <div className="col-12">{showAddToCart(addtoCart)}</div>
          <div className="col-12">{showRemoveFromCart(removeFromCart)}</div>
        </div>
      </div>
    </div>
  );
};

export default Card;
