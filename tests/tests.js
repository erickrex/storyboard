var expect = require('chai').expect;
import Graph from '../src/nodeGraph'

var graph;

describe("starting the game", function() { 
  beforeEach(function() {
    graph = new Graph({
      "startNode": "2",
      "nodes": {
        "1": {
          "nodeId": "1"
        },
        "2": {
          "nodeId": "2"
        } 
      }
    });
  });
  
  it("should not have a node before the game starts", function() {
    expect(graph.currentNode).to.be.undefined;
  });

  it("should set the start node after starting", function() { 
    graph.start();
    expect(graph.currentNode).to.equal("2");
  });
});

describe("outputting content", function() {
  it("should send the initial node's text", function(done) {
    graph = new Graph({
      "startNode": "1",
      "nodes": {
        "1": {
          "nodeId": "1",
          "passages": [
            {
              "type": "text",
              "content": "Hello World!"
            }
          ]
        } 
      }
    });

    graph.addOutput("text", function(text) {
      expect(text).to.equal("Hello World!");
      done();
    });

    graph.start();
  });
});

describe("making choices", function() {
  beforeEach(function() {
    graph = new Graph({
      "startNode": "1",
      "nodes": {
        "1": {
          "nodeId": "1",
          "passages": [
            {
              "passageId": "5",
            }
          ],
          "choices": [
            {
              "nodeId": "2",
              "predicate": {
                "counter": { "gte": 10 }
              }
            }   
          ]
        },
        "2": {
          "nodeId": "2"
        } 
      }
    });

    graph.start();
  });  

  // TODO: This is no longer meaningful, until we have the distinction of synchronous vs asynchronous output types
  context.skip("when the output happens instantly", function() {
    it("should switch states when a condition is triggered", function() {
      expect(graph.currentNode).to.equal("1");
      graph.receiveInput("counter", 11);
      expect(graph.currentNode).to.equal("2");
    });

    it("should not switch states if the condition is not triggered", function() {
      graph.receiveInput("counter", 5);
      expect(graph.currentNode).to.equal("1");
    });
  });

  context("when the output needs to finish first", function() {
    it("shouldn't change nodes until the content finishes", function() {
      graph.receiveInput("counter", "11");
      expect(graph.currentNode).to.equal("1");

      graph.completePassage("5");
      expect(graph.currentNode).to.equal("2");
    });
  });
});

/*
playing node content
  text
  waiting for audio to complete

making choices
  explicit choices
  predicates
    when predicate is already met
    when updates via interrupt
  set previousChoice
  set currentNode, nodeHistory

storylets


--

invisible and grayed out choices
*/