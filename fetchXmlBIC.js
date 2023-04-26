import fetch from "node-fetch";
import AdmZip from 'adm-zip';
import iconv from 'iconv-lite';
import { DOMParser } from 'xmldom';

export async function fetchXmlBIC() {
  try {
    const response = await fetch('http://cbr.ru/s/newbik')
    const data = await response.arrayBuffer()
    return xmlToObject(data)
  } catch (e) {
    console.error(e)
    return []
  }
}

function addVals(v) {
  const result = []
  const Accounts = v.filter(x => x.Account)
  if (Accounts.length > 0) {
    const BIC = v.filter(x => !x.Account)
    for (let i = 0; i < Accounts.length; i++)
      result.push(Object.assign({}, ...BIC, Accounts[i]))
  }
  return result
}

function xmlToObject(file) {
  const buf = Buffer.from(file);
  const zip = new AdmZip(buf);
  const zipEntries = zip.getEntries();
  const parser = new DOMParser()
  const decodeFile = iconv.encode(iconv.decode(zip.readFile(zipEntries[0]), 'win1251'), 'utf8').toString()
  const xml = parser.parseFromString(decodeFile, "text/xml");
  const transXML = transformXml(xml.documentElement.nodeName)
  return transXML(xml.documentElement)
}

function transformXml(rootElem) {
  var result = [], vals = [], root = rootElem;
  function parseRecursive(dom) {
    if (dom.nodeName === root) {
      result.push(...addVals(vals))
      vals = [];
    }
    for (var node = dom.firstChild; node; node = node.nextSibling) {
      parseRecursive(node);
      let attrs = {}
      if (node.attributes)
        for (let j = 0; j < node.attributes.length; j++)
          attrs[node.attributes[j].name] = node.attributes[j].value;
      vals.push(attrs)
    }
    //last element
    if (dom.nodeName === root && !dom.nextSibling) {
      result.push(...addVals(vals))
      vals = []
      return result
    }
  }
  return parseRecursive
}
