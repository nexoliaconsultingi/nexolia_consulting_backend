const mongoose = require('mongoose');
const Joi = require('joi');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 100
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: 8
    },
    access: {
        type: [{
            type: String,
            enum: ['admin', 'store', 'erp', 'academy']
        }],
        default: ['admin'],
        validate: {
            validator: (arr) => Array.isArray(arr) && arr.length > 0,
            message: 'User must have at least one access role'
        }
    },
    lastLoginAt: {
        type: Date,
        default: null
    },
    lastSeenAt: {
        type: Date,
        default: null
    },
}
, {
    timestamps: true
});

const User = mongoose.model('User', userSchema);

// Vérification de l'inscription d'un nouvel utilisateur
function registerVerify(obj) {
    const schema = Joi.object({
        name: Joi.string().trim().min(2).max(100).required(),
        email: Joi.string().trim().min(5).max(100).required().email(),
        password: Joi.string().trim().min(8).required(),
        access: Joi.array().items(
            Joi.string().valid('admin', 'store', 'erp', 'academy')
        ).min(1).required(),
    });
    return schema.validate(obj);
}



// Vérification de la connexion de l'utilisateur
function loginVerify(obj) {
    const schema = Joi.object({
        email: Joi.string().trim().min(5).max(100).required().email(),
        password: Joi.string().trim().min(8).required()
    });
    return schema.validate(obj);
}





// Vérification de la mise à jour d'un utilisateur (tous les champs optionnels)
function updateUserVerify(obj) {
    const schema = Joi.object({
        name: Joi.string().trim().min(2).max(100),
        email: Joi.string().trim().min(5).max(100).email(),
        password: Joi.string().trim().min(8),
        access: Joi.array().items(
            Joi.string().valid('admin', 'store', 'erp', 'academy')
        ).min(1),
    });
    return schema.validate(obj);
}

module.exports = {
    User,
    registerVerify,
    loginVerify,
    updateUserVerify
};
