class APIFeatures{
    constructor(query,ogqueryObj){
        this.query = query;
        this.ogqueryObj = ogqueryObj;
    }

    filter(){
        const queryObj = {...this.ogqueryObj};
        const toBeEliminated = ['page','sort','limit','fields'];
        toBeEliminated.forEach((curr)=>delete queryObj[curr]);

        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/\b(lt|lte|gt|gte)\b/g,(match)=>`$${match}`);
        this.query = this.query.find(JSON.parse(queryStr));

        return this;
    }
    sort(){
        if(this.ogqueryObj.sort){
            const sortingCriteria = this.ogqueryObj.sort.split(',').join(' ');
            this.query = this.query.sort(sortingCriteria);
        }
        else{
            this.query = this.query.sort('-createdAt');
        }
        return this;
    }
    limitFields(){
        if(this.ogqueryObj.fields){
            const fieldToShow = this.ogqueryObj.fields.split(',').join(' ');
            this.query = this.query.select(fieldToShow);
        }
        else{
            this.query = this.query.select('-__v');
        }
        return this;
    }
    paginate(){
        let page = this.ogqueryObj.page*1 || 1;
        let limit = this.ogqueryObj.limit*1 || 100;
        let toSkip = (page-1)*limit;

        this.query = this.query.skip(toSkip).limit(limit);
        return this;
    }
}

module.exports = APIFeatures;