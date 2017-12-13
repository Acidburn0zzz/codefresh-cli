const _                   = require('lodash');
const CFError             = require('cf-errors');
const { sendHttpRequest } = require('./helper');
const filesize            = require('filesize');
const moment              = require('moment');
const Image               = require('../entities/Image');

const getAll = async (options) => {
    const qs = {
        limit: options.limit,
        offset: 0,
        metadata: options.labels,
        select: 'internalName tags internalImageId created size imageDisplayName',
    };

    if (!options.volumeImages) {
        qs.metadata['cf_volume'] = false;
    }

    if (options.sha) {
        qs.sha = options.sha;
    }

    const RequestOptions = {
        url: '/api/images',
        qs,
    };

    const images = await sendHttpRequest(RequestOptions);
    const res    = [];
    _.forEach(images.docs, (image) => {
        _.forEach(image.tags, (tag) => {
            // in case we are filtering by registries, ignore the image if it is not from the registires list
            if (options.filterRegistries && options.filterRegistries.indexOf(tag.registry) === -1) {
                return;
            }
            const data = {
                name: image.imageDisplayName,
                tag: tag.tag,
                image_id: image.internalImageId.substring(0, 12),
                created: moment(tag.created).fromNow(),
                size: filesize(image.size),
                pull: `${tag.registry}/${tag.repository}:${tag.tag}`,
            };
            res.push(new Image(data));
        });
    });
    return res;
};

const getImageById = async (imageId) => {
    const options = {
        url: `/api/images/${encodeURIComponent(imageId)}`,
        method: 'GET',
    };
    const image = await sendHttpRequest(options);
    let data = {};
    _.forEach(image.tags, (tag) => {
        data = {
            name: image.imageDisplayName,
            tag: tag.tag,
            image_id: image.internalImageId.substring(0, 12),
            created: moment(tag.created).fromNow(),
            size: filesize(image.size),
            pull: `${tag.registry}/${tag.repository}:${tag.tag}`,
        };
    });

    const currImage = new Image(data);

    return currImage;
};

const getDockerImageId = async (imageDisplayName, tag) => {
    const options = {
        url: '/api/images',
        qs: {
            imageDisplayName,
            tag,
            select: 'internalImageId',
        },
    };

    const results = await sendHttpRequest(options);

    if (!results.length) {
        throw new CFError('Image does not exist');
    }

    if (results.length > 1) {
        throw new CFError(`Could not get image id. ${results.length} images found.`);
    }

    return results[0].internalImageId;
};

const annotateImage = async (dockerImageId, annotations) => {
    const options = {
        url: `/api/images/${encodeURIComponent(dockerImageId)}/metadata`,
        method: 'POST',
        body: annotations,
    };

    return await sendHttpRequest(options);
};

module.exports = {
    annotateImage,
    getDockerImageId,
    getAll,
    getImageById,
};