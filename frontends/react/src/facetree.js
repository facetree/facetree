import axios from 'axios';
class Facetree {

    facetree_backend = 'https://facetree-dev.ardoe.net';

    database = {
        individuals: {},
        families: {},
        parentin: {},
        childin: {}
    };

    add_to_index_set = (index, individual_id, family) => {
        if (!index[individual_id]) {
            index[individual_id] = new Set();
        }
        index[individual_id].add(family);
    }

    database_add_records = records => {
        for (var i in records) {
            var rec = records[i];
            if (rec.type == 'Individual') {
                if (!this.database.individuals[rec.id] || this.database.individuals[rec.id].version < rec.version) {
                    this.database.individuals[rec.id] = rec;
                }
                if (rec.root) {
                    this.database.root = rec;
                }
            } else if (rec.type == 'Family') {
                let old_rec = this.database.families[rec.id];
                if (!old_rec || this.database.families[rec.id].version < rec.version) {
                    if (old_rec) {
                        this.database.parentin[old_rec.father].delete(old_rec.id);
                        this.database.parentin[old_rec.mother].delete(old_rec.id);
                        for (var c in old_rec.children) {
                            this.database.childin[old_rec.children[c]].delete(old_rec.id);
                        }
                    }
                    this.add_to_index_set(this.database.parentin, rec.father, rec.id);
                    this.add_to_index_set(this.database.parentin, rec.mother, rec.id);
                    for (var c in rec.children) {
                        this.add_to_index_set(this.database.childin, rec.children[c], rec.id);
                    }
                    this.database.families[rec.id] = rec;
                }
            } else {
                console.log("Unknown record type:", rec);
            }
        }
        if (records.length > 0 && this.database.updated_cb) {
            this.database.updated_cb(records);
        }
    }

    database_poll = since => {
        setTimeout(function () {
            axios.get(this.facetree_backend + "/v1/updates/" + since, {"headers": this.auth_headers})
            .then(response => {
                this.auth_token = response.data.token;
                this.database_add_records(response.data.records);
                this.database_poll(response.data.since);
            })
            .catch(function (error) {
                console.log("this.database longpoll failed.", error)
            });

        }, 1);
    }

    database_download = () => {
        return axios.get(this.facetree_backend + "/v1/records", {"headers": this.auth_headers})
        .then(response => {
            this.database_add_records(response.data);
        })
        .catch(function (error) {
            console.log("Records failed.", error)
        });
    }

    database_updater = (auth_token, updated_cb) => {
        this.database.updated_cb = updated_cb;
        this.auth_headers = {"Authorization": "Bearer " + auth_token};
        this.database_poll("NOW");
        setTimeout(this.database_download, 10);
    }

    get_image = imgId => (
        axios.get(this.facetree_backend + "/v1/images/" + imgId + "/thumb.jpg/base64", {"headers": this.auth_headers})
        .then(response => response.data)
    )
}

export default new Facetree()