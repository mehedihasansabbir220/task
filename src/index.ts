import express from 'express';
import knex from 'knex';

const app = express();

app.use( express.json() );

const knexInstance = knex( {
    client: 'mysql2',
    connection: {
        host: 'localhost',
        user: 'root',
        password: 'password',
        database: 'mydatabase',
    },
} );

// GET /categories
app.get( '/categories', async ( req, res ) => {
    const categories = await knexInstance.select( '*' ).from( 'categories' );
    res.json( categories );
} );

// GET /categories/:id
app.get( '/categories/:id', async ( req, res ) => {
    const { id } = req.params;
    const category = await knexInstance
        .select( '*' )
        .from( 'categories' )
        .where( { id } )
        .first();
    if ( !category ) {
        return res.status( 404 ).json( { error: 'Category not found' } );
    }
    res.json( category );
} );

// POST /categories
app.post( '/categories', async ( req, res ) => {
    const { name, parent_category_id } = req.body;
    if ( !name ) {
        return res.status( 400 ).json( { error: 'Name is required' } );
    }
    const [ id ] = await knexInstance( 'categories' ).insert( {
        name,
        parent_category_id,
    } );
    const category = await knexInstance
        .select( '*' )
        .from( 'categories' )
        .where( { id } )
        .first();
    res.status( 201 ).json( category );
} );

// PUT /categories/:id
app.put( '/categories/:id', async ( req, res ) => {
    const { id } = req.params;
    const { name, parent_category_id } = req.body;
    if ( !name ) {
        return res.status( 400 ).json( { error: 'Name is required' } );
    }
    const updated = await knexInstance( 'categories' )
        .where( { id } )
        .update( { name, parent_category_id } );
    if ( !updated ) {
        return res.status( 404 ).json( { error: 'Category not found' } );
    }
    const category = await knexInstance
        .select( '*' )
        .from( 'categories' )
        .where( { id } )
        .first();
    res.json( category );
} );

// DELETE /categories/:id
app.delete( '/categories/:id', async ( req, res ) => {
    const { id } = req.params;

    // Deactivate the specified category and all its children recursively
    const deactivateCategories = async ( categoryId ) => {
        const affectedRows = await knexInstance( 'categories' )
            .where( { id: categoryId } )
            .update( { active: false } );

        if ( affectedRows === 0 ) {
            throw new Error( `Category with ID ${ categoryId } not found` );
        }

        const childCategories = await knexInstance( 'categories' ).where( {
            parent_category_id: categoryId,
            active: true,
        } );

        for ( const category of childCategories ) {
            await deactivateCategories( category.id );
        }

        const affectedProducts = await knexInstance( 'product_category' )
            .where( { category_id: categoryId } )
            .delete();

        console.log( `Deactivated ${ affectedProducts } products in category ${ categoryId }` );
    };

    try {
        await deactivateCategories( id );
        res.status( 204 ).end();
    } catch ( error ) {
        console.error( error );
        res
            .status( 500 )
            .json( { error: 'An error occurred while deactivating the category' } );
    }
} );
// GET /attributes
app.get( '/attributes', async ( req, res ) => {
    const attributes = await knexInstance.select( '*' ).from( 'attributes' );
    res.json( attributes );
} );

// GET /attributes/:id
app.get( '/attributes/:id', async ( req, res ) => {
    const { id } = req.params;
    const attribute = await knexInstance.select( '*' ).from( 'attributes' ).where( { id } ).first();
    if ( !attribute ) {
        return res.status( 404 ).json( { error: 'Attribute not found' } );
    }
    res.json( attribute );
} );
// GET /products
app.get( '/products', async ( req, res ) => {
    const products = await knexInstance.select( '*' ).from( 'products' );
    res.json( products );
} );

/ POST /products
app.post( '/products', async ( req, res ) => {
    const { name, description, price, categories } = req.body;
    if ( !name ) {
        return res.status( 400 ).json( { error: 'Name is required' } );
    }
    const [ id ] = await knexInstance( 'products' ).insert( {
        name,
        description,
        price,
    } );
    if ( categories && categories.length > 0 ) {
        const productCategory = categories.map( ( categoryId ) => ( {
            product_id: id,
            category_id: categoryId,
        } ) );
        await knexInstance( 'product_category' ).insert( productCategory );
    }
    const product = await knexInstance
        .select( '*' )
        .from( 'products' )
        .where( { id } )
        .first();
    res.status( 201 ).json( product );
} );

// GET /products/:id
app.get( '/products/:id', async ( req, res ) => {
    const { id } = req.params;
    const product = await knexInstance
        .select( '*' )
        .from( 'products' )
        .where( { id } )
        .first();
    if ( product ) {
        const categories = await knexInstance
            .select( 'categories.' )
            .from( 'categories' )
            .join( 'product_category', 'categories.id', '=', 'product_category.category_id' )
            .where( 'product_category.product_id', id );
        const attributes = await knexInstance
            .select( 'attributes.', 'product_attributes.value' )
            .from( 'attributes' )
            .join( 'product_attributes', 'attributes.id', '=', 'product_attributes.attribute_id' )
            .where( 'product_attributes.product_id', id );
        product.categories = categories;
        product.attributes = attributes;
        res.json( product );
    } else {
        res.status( 404 ).json( { error: 'Product not found' } );
    }
} );

// PUT /products/:id
app.put( '/products/:id', async ( req, res ) => {
    const { id } = req.params;
    const { name, description, price, categories } = req.body;
    if ( !name ) {
        return res.status( 400 ).json( { error: 'Name is required' } );
    }
    const updatedProduct = {
        name,
        description,
        price,
        updated_at: knexInstance.fn.now(),
    };
    await knexInstance( 'products' ).where( { id } ).update( updatedProduct );
    if ( categories && categories.length > 0 ) {
        const productCategory = categories.map( ( categoryId ) => ( {
            product_id: id,
            category_id: categoryId,
        } ) );
        await knexInstance( 'product_category' )
            .where( 'product_id', id )
            .del();
        await knexInstance( 'product_category' ).insert( productCategory );
    } else {
        await knexInstance( 'product_category' )
            .where( 'product_id', id )
            .del();
    }
    const updatedAttributes = req.body.attributes || [];
    await knexInstance( 'product_attributes' )
        .where( 'product_id', id )
        .del();
    const productAttributes = updatedAttributes.map( ( attr ) => ( {
        product_id: id,
        attribute_id: attr.attribute_id,
        value: attr.value,
    } ) );
    await knexInstance( 'product_attributes' ).insert( productAttributes );
    const product = await knexInstance
        .select( '*' )
        .from( 'products' )
        .where( { id } )
        .first();
    res.json( product );
} );

// DELETE /products/:id
app.delete( '/products/:id', async ( req, res ) => {
    const { id } = req.params;
    await knexInstance( 'product_category' ).where( 'product_id', id ).del();
    await knexInstance( 'product_attributes' ).where( 'product_id', id ).del();
    await knexInstance( 'products' ).where( { id } ).del();
    res.json( { success: true } );
} );

// POST /products/:id/attributes
app.post( '/products/:id/attributes', async ( req, res ) => {
    const { id } = req.params;
    const { attribute_id, value } = req.body;
    if ( !attribute_id || !value ) {
        return res.status( 400 ).json( { error: 'Attribute ID and value are required' } );
    }
    const [ productAttributeId ] = await knexInstance( 'product_attributes' ).insert( {
        product_id: id,
        attribute_id,
        value,
    } );
    const productAttribute = await knexInstance
        .select( 'product_attributes.id', 'attributes.name', 'product_attributes.value' )
        .from( 'product_attributes' )
        .join( 'attributes', 'product_attributes.attribute_id', 'attributes.id' )
        .where( { id: productAttributeId } )
        .first();
    res.status( 201 ).json( productAttribute );
} );

// PUT /products/:id/attributes/:attributeId
app.put( '/products/:id/attributes/:attributeId', async ( req, res ) => {
    const { id, attributeId } = req.params;
    const { value } = req.body;
    if ( !value ) {
        return res.status( 400 ).json( { error: 'Value is required' } );
    }
    const updated = await knexInstance( 'product_attributes' )
        .where( { product_id: id, attribute_id: attributeId } )
        .update( { value } );
    if ( !updated ) {
        return res.status( 404 ).json( { error: 'Product attribute not found' } );
    }
    const productAttribute = await knexInstance
        .select( 'product_attributes.id', 'attributes.name', 'product_attributes.value' )
        .from( 'product_attributes' )
        .join( 'attributes', 'product_attributes.attribute_id', 'attributes.id' )
        .where( { product_id: id, attribute_id: attributeId } )
        .first();
    res.json( productAttribute );
} );

// DELETE /products/:id/attributes/:attributeId
app.delete( '/products/:id/attributes/:attributeId', async ( req, res ) => {
    const { id, attributeId } = req.params;
    const deleted = await knexInstance( 'product_attributes' )
        .where( { product_id: id, attribute_id: attributeId } )
        .del();
    if ( !deleted ) {
        return res.status( 404 ).json( { error: 'Product attribute not found' } );
    }
    res.status( 200 ).json( "delete scussfully " )
} )
app.listen( 3000, () => {
    console.log( 'Server listening on port 3000' );
} );
