require("dotenv").config();

const { Client } = require("@notionhq/client");
const notion = new Client({ auth: process.env.NOTION_SECRET });

const notionBlockToHTML = {
    heading_2: "h2",
    paragraph: "p"
};

const getDatabase = async () => {
    return await notion.databases.retrieve({
        database_id: process.env.NOTION_PORTFOLIO_DATABASE_ID
    });
};

/**
 * getPage:     returns page of specified id.
 * 
 * @param {*} notionPageId
 * @returns
 */
const getNotionPageBlocks = async (notionPageId) => {
    return (await notion.blocks.children.list({
        block_id: notionPageId
    })).results;
};

/**
 * 
 * @returns JSON array, objects have portfolio record data
 */
const getPortfolios = async () => {
    return (await notion.databases.query({
        database_id: process.env.NOTION_PORTFOLIO_DATABASE_ID,
        filter: {
            property: "enabled",
            checkbox: {
                equals: true
            }
        },
        filter_properties: [ 
            "%3A%5DHn", 
            "PMop", 
            "S%3DWZ", 
            "XJdJ",
            "lA%5C%5E",
            "xRKm",
            "%7DLJv",
            "y%5BLK",
            "title"
        ]
    })).results;
};

const extractPortfolioData = (portfolioObject) => {
    if (!portfolioObject)
        return {};

    const processedPortfolio = {
        endDate: portfolioObject.properties.endDate.date.start,
        startDate: portfolioObject.properties.startDate.date.start,
        repo: portfolioObject.properties.repo.url,
        try: portfolioObject.properties.try.url,
        title: portfolioObject.properties.title.title[0].plain_text,
        pageId: portfolioObject.properties.pageId.rich_text[0].plain_text,
        tags: portfolioObject.properties.tags.multi_select.map(tag => { 
            return tag.name 
        }),
        images: portfolioObject.properties.image.files.map(file => { 
            return {
                name: file.name,
                url: file.file.url
            }
        })
    };

    return processedPortfolio;
}

const extractBlockData = (pageBlock) => {
    let blockType = pageBlock.type;
    let blockContent = pageBlock[blockType].rich_text[0].plain_text;
    return (
        `<${notionBlockToHTML[blockType]}>${blockContent}</${notionBlockToHTML[blockType]}>`
    );
}

const extractPageBlockData = async (pageBlocks) => {
    if (!pageBlocks) 
        return {};

    let convert = "<div>";
    pageBlocks.forEach((block) => {
        convert = convert.concat(extractBlockData(block));
    });
    convert = convert.concat("</div>");

    console.log(`${convert}\n`);
    return convert;
};

// getDatabase().then((results) => { console.log(results) });

getPortfolios()
    .then((results) => {
        let processedPortfolios = results.map((result) => {
            return extractPortfolioData(result) 
        });
        processedPortfolios.forEach((processedPortfolio) => {
            getNotionPageBlocks(processedPortfolio.pageId)
                .then((results1 => {
                    // console.log(results1);
                    extractPageBlockData(results1)
                        .then(results2 => {
                            // console.log(results2);
                        })
                        .catch(error => {
                            console.log(`Error: ${error}`);
                        });
                }))
                .catch(error => {
                    console.log(`Error: ${error}`);
                });
        });
    })
    .catch((error) => {
        console.log(`Error: ${error}`);
    });