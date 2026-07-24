import Property from "../models/Property.js";

const isAdmin = (user) => user?.role === "admin";

const isPropertyOwner = (property, user) =>
  property.submittedBy.toString() === user?._id?.toString();

const parseJsonField = (value, fallback = null) => {
  if (!value) return fallback;

  if (typeof value === "object") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const normalizeMedia = (media) => {
  const parsedMedia = parseJsonField(media, {});

  return {
    images: Array.isArray(parsedMedia?.images) ? parsedMedia.images : [],
    video: parsedMedia?.video || {
      url: "",
      publicId: "",
    },
  };
};

const getUploadedMedia = (req, existingMedia = null) => {
  const media = normalizeMedia(req.body.media || existingMedia);
  const uploadedImages = (req.files?.images || []).map((file) => ({
    filename: file.filename,
    publicId: file.filename,
  }));

  const uploadedVideo = req.files?.video?.[0];

  if (uploadedVideo) {
    media.video = {
      filename: uploadedVideo.filename,
      publicId: uploadedVideo.filename,
    };
  }

  return media;
};

const parseBoolean = (value) => value === true || value === "true";

// Admin-created properties are approved immediately.
// Employee-created properties remain pending until admin approval.
export const createProperty = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      city,
      address,
      price,
      priceRange,
      mapsLink,
      status,
      isFeatured,
    } = req.body;

    const owner = parseJsonField(req.body.owner);

    if (
      !title ||
      !description ||
      !category ||
      !city ||
      !address ||
      !price ||
      !mapsLink ||
      !owner?.name ||
      !owner?.phone
    ) {
      return res.status(400).json({
        message: "Please fill all required property fields.",
      });
    }

    const adminCreated = isAdmin(req.user);
    const media = getUploadedMedia(req);

    const property = await Property.create({
      title,
      description,
      category,
      city,
      address,
      price,
      priceRange: priceRange || "",
      media,
      mapsLink,
      owner,
      submittedBy: req.user._id,
      status: adminCreated && status ? status : "available",
      isFeatured: adminCreated ? parseBoolean(isFeatured) : false,
      approvalStatus: adminCreated ? "approved" : "pending",
      approvedBy: adminCreated ? req.user._id : null,
      approvedAt: adminCreated ? new Date() : null,
    });

    res.status(201).json({
      message: adminCreated
        ? "Property created and approved successfully."
        : "Property submitted successfully and is awaiting admin approval.",
      property,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Public: approved and available properties only.
export const getPublicProperties = async (req, res) => {
  try {
    const { city, category, search } = req.query;

    const filter = {
      approvalStatus: "approved",
      status: "available",
    };

    if (city) {
      filter.city = new RegExp(city, "i");
    }

    if (category) {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        { title: new RegExp(search, "i") },
        { city: new RegExp(search, "i") },
        { address: new RegExp(search, "i") },
        { category: new RegExp(search, "i") },
      ];
    }

    const properties = await Property.find(filter)
      .select("-approvalNote")
      .sort({ isFeatured: -1, viewCount: -1, createdAt: -1 });

    res.status(200).json({
      count: properties.length,
      properties,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Homepage Most Visited Estates endpoint.
export const getFeaturedProperties = async (req, res) => {
  try {
    const properties = await Property.find({
      approvalStatus: "approved",
      status: "available",
    })
      .select("-approvalNote")
      .sort({ isFeatured: -1, viewCount: -1, createdAt: -1 })
      .limit(6);

    res.status(200).json({
      count: properties.length,
      properties,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Admin: all property records, including pending and rejected submissions.
export const getAllProperties = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({
        message: "Only administrators can view all property records.",
      });
    }

    const { approvalStatus, status, city, category } = req.query;

    const filter = {};

    if (approvalStatus) filter.approvalStatus = approvalStatus;
    if (status) filter.status = status;
    if (city) filter.city = new RegExp(city, "i");
    if (category) filter.category = category;

    const properties = await Property.find(filter)
      .populate("submittedBy", "fullName employeeId email phone role")
      .populate("approvedBy", "fullName employeeId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: properties.length,
      properties,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Employee: only properties submitted by the logged-in user.
export const getMyProperties = async (req, res) => {
  try {
    const properties = await Property.find({
      submittedBy: req.user._id,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      count: properties.length,
      properties,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Public details for approved listings.
export const getPropertyById = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate("submittedBy", "fullName employeeId")
      .populate("approvedBy", "fullName employeeId");

    if (!property) {
      return res.status(404).json({
        message: "Property not found.",
      });
    }

    const isPublicProperty =
      property.approvalStatus === "approved" && property.status === "available";

    if (!isPublicProperty) {
      return res.status(404).json({
        message: "Property not found.",
      });
    }

    property.viewCount += 1;
    await property.save();

    res.status(200).json({
      property,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Admin can update any property.
// Employee can update only their own submitted property.
// Employee edits return the property to pending approval.
export const updateProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        message: "Property not found.",
      });
    }

    const adminUser = isAdmin(req.user);
    const propertyOwner = isPropertyOwner(property, req.user);

    if (!adminUser && !propertyOwner) {
      return res.status(403).json({
        message: "You are not allowed to update this property.",
      });
    }

    const {
      title,
      description,
      category,
      city,
      address,
      price,
      priceRange,
      mapsLink,
      status,
      isFeatured,
    } = req.body;

    const owner = parseJsonField(req.body.owner);
    const media = getUploadedMedia(req, property.media);

    if (title !== undefined) property.title = title;
    if (description !== undefined) property.description = description;
    if (category !== undefined) property.category = category;
    if (city !== undefined) property.city = city;
    if (address !== undefined) property.address = address;
    if (price !== undefined) property.price = price;
    if (priceRange !== undefined) property.priceRange = priceRange;
    if (mapsLink !== undefined) property.mapsLink = mapsLink;
    if (owner) property.owner = owner;

    property.media = media;

    if (adminUser) {
      if (status !== undefined) property.status = status;
      if (isFeatured !== undefined) {
        property.isFeatured = parseBoolean(isFeatured);
      }
    } else {
      property.approvalStatus = "pending";
      property.approvalNote = "";
      property.approvedBy = null;
      property.approvedAt = null;
      property.isFeatured = false;
    }

    const updatedProperty = await property.save();

    res.status(200).json({
      message: adminUser
        ? "Property updated successfully."
        : "Property updated and submitted again for admin approval.",
      property: updatedProperty,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Admin reviews employee-submitted properties.
export const reviewProperty = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({
        message: "Only administrators can approve or reject properties.",
      });
    }

    const { approvalStatus, approvalNote, status, isFeatured } = req.body;

    if (!["approved", "rejected"].includes(approvalStatus)) {
      return res.status(400).json({
        message: "Approval status must be approved or rejected.",
      });
    }

    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        message: "Property not found.",
      });
    }

    property.approvalStatus = approvalStatus;
    property.approvalNote = approvalNote || "";

    if (approvalStatus === "approved") {
      property.approvedBy = req.user._id;
      property.approvedAt = new Date();

      if (status !== undefined) {
        property.status = status;
      }

      if (isFeatured !== undefined) {
        property.isFeatured = parseBoolean(isFeatured);
      }
    } else {
      property.approvedBy = null;
      property.approvedAt = null;
      property.isFeatured = false;
    }

    const reviewedProperty = await property.save();

    res.status(200).json({
      message:
        approvalStatus === "approved"
          ? "Property approved successfully."
          : "Property rejected successfully.",
      property: reviewedProperty,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Admin only.
export const deleteProperty = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({
        message: "Only administrators can delete properties.",
      });
    }

    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        message: "Property not found.",
      });
    }

    await property.deleteOne();

    res.status(200).json({
      message: "Property deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
