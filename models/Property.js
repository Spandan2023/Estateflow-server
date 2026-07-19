import mongoose from "mongoose";

const propertySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      enum: ["Apartment", "Villa", "House", "Plot", "Commercial", "Office", "Other"],
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    priceRange: {
      type: String,
      trim: true,
      default: "",
    },

    media: {
      images: [
        {
          url: {
            type: String,
            required: true,
          },
          publicId: {
            type: String,
            default: "",
          },
        },
      ],

      video: {
        url: {
          type: String,
          default: "",
        },
        publicId: {
          type: String,
          default: "",
        },
      },
    },

    mapsLink: {
      type: String,
      required: true,
      trim: true,
    },

    owner: {
      name: {
        type: String,
        required: true,
        trim: true,
      },

      phone: {
        type: String,
        required: true,
        trim: true,
      },
    },

    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    approvalNote: {
      type: String,
      trim: true,
      default: "",
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ["available", "sold", "inactive"],
      default: "available",
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    viewCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Property", propertySchema);