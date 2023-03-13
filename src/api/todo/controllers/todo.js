'use strict';

/**
 * todo controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::todo.todo', ({ strapi }) => ({
    async three(ctx) {
        const { id } = ctx.state.user;

        const todos = await strapi.db.query('api::todo.todo').findMany({
            orderBy: { createdAt: 'asc' },
            filters: {
                user: id,
            },
            done: false,
            limit: 3
        });

        const sanitizedEntity = await this.sanitizeOutput(todos, ctx);
        let { data, meta } = this.transformResponse(sanitizedEntity);

        return {
            data, meta
        }
    },

    async create(ctx) {
        ctx.request.body.data = {
            ...ctx.request.body.data,
            user: ctx.state.user.id
        }

        const response = await super.create(ctx);

        return response;
    },

    async find(ctx) {
        const limit = ctx.query.limit ?? 20;

        // deleting `page` parameter, because cannot use page&offset(start) in one query
        const { ["page"]: pageRemoved, ...ctxquery } = ctx.query;
        ctx.query = ctxquery;

        const page = parseInt(pageRemoved) ?? 1;

        // hiding populate, because don`t need information about user on client
        const query = {
            ...ctx.query,
            // populate: {
            //     user: true
            // },
            filters: {
                user: ctx.state.user.id
            },
            start: (page - 1) * limit ?? 0,
            limit: limit
        }

        const entity = await strapi.entityService.findMany("api::todo.todo", query);
        const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
        let { data, meta } = this.transformResponse(sanitizedEntity);

        return {
            data,
            meta: {
                ...meta,
                total: await strapi.db.query("api::todo.todo").count(query),
                page: page,
                limit: query.limit,
            },
        };
    }
}));