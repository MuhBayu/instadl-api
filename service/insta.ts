import unirest from 'unirest'

function validURL(str) {
    var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
      '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
    return !!pattern.test(str);
  }

export const getMedia = (url) => {
    let shortcode
    if(validURL(url)) {
        let url_split= url.replace(/\/$/i, '').split('/')
        if(url_split && url_split.length > 4) {
            shortcode = url_split[4]
        } else {
            return null
        }
    } else {
        shortcode = url
    }
    return unirest.get(`https://www.instagram.com/p/${shortcode}/?__a=1`).then(data => {
        try {
            if(data.status == 200 && data.body.graphql) {
                return data.body.graphql
            } return null
        } catch (error) {
            return null
        }
    }).catch(data => null)
}

export const getProfile = (username) => {
    return unirest.get(`https://www.instagram.com/${username}/?__a=1`).then(data => {
        try {
            if(data.status == 200 && data.body.graphql) {
                return data.body.graphql.user
            } return null
        } catch (error) {
            return null
        }
    }).catch(data => null)
}