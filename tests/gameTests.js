"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var chai = require("chai");
var sinonChai = require("sinon-chai");
var sinon_1 = require("sinon");
chai.use(sinonChai);
var expect = chai.expect;
var game_1 = require("../src/game");
var Actions = require("../src/gameActions");
describe.skip("initialization", function () {
    describe("creating a nodeGraph", function () {
        var node, game;
        beforeEach(function () {
            var story = "\n        start: node\n        # node\n      ";
            game = new game_1.Game(story);
        });
        it("should create a valid nodeGraph with the passed options", function () {
            expect(game.story.graph).to.exist;
            expect(game.story.graph.start).to.equal("1");
            expect(Object.keys(game.story.graph.nodes)).to.have.length(1);
        });
        it("shouldn't start the game", function () {
            expect(game.state.graph.currentNodeId).to.be.undefined;
        });
    });
    describe("creating a nodeBag", function () {
        it("should create a valid nodeBag with the passed nodes", function () {
            var story = "## node";
            var game = new game_1.Game(story);
            expect(game.story.bag).to.exist;
            expect(Object.keys(game.story.bag.nodes)).to.have.length(1);
        });
    });
});
describe("playing the node graph", function () {
    context("when starting the game", function () {
        it("should play the appropriate content via an output", function () {
            var game = new game_1.Game({
                "graph": {
                    "start": "1",
                    "nodes": {
                        "1": {
                            "nodeId": "1",
                            "passages": [
                                {
                                    "passageId": "5",
                                    "type": "text",
                                    "content": "Hello World!"
                                }
                            ]
                        }
                    }
                }
            });
            var callback = sinon_1.spy();
            game.addOutput("text", callback);
            game.start();
            expect(callback).to.have.been.calledWith("Hello World!", "5");
        });
    });
    context("when a node has no passages", function () {
        var game, callback;
        beforeEach(function () {
            game = new game_1.Game({
                "graph": {
                    "start": "1",
                    "nodes": {
                        "1": {
                            "nodeId": "1",
                            "choices": [
                                {
                                    "nodeId": "2",
                                    "predicate": {
                                        "continue": { "gte": 1 }
                                    }
                                }
                            ]
                        },
                        "2": {
                            "nodeId": "2",
                            "passages": [
                                {
                                    "passageId": "6",
                                    "type": "text",
                                    "content": "Goodbye World!"
                                }
                            ]
                        }
                    }
                }
            });
            callback = sinon_1.spy();
            game.addOutput("text", callback);
            game.start();
        });
        context("when a predicate has not yet been met", function () {
            it("should wait for the predicate to be met", function () {
                expect(callback).not.to.have.been.called;
            });
        });
        context("when a predicate has been met", function () {
            it("should go immediately on", function () {
                game.receiveInput("continue", true);
                expect(callback).to.have.been.calledWith("Goodbye World!", "6");
            });
        });
    });
    context("when there are multiple passages", function () {
        describe("waiting for completion", function () {
            var first, second, game, callback;
            beforeEach(function () {
                first = {
                    "passageId": "2",
                    "type": "text",
                    "content": "First"
                };
                second = {
                    "passageId": "3",
                    "type": "text",
                    "content": "Second"
                };
                game = new game_1.Game({
                    "graph": {
                        "start": "1",
                        "nodes": {
                            "1": {
                                "nodeId": "1",
                                "passages": [first, second]
                            },
                        }
                    }
                });
                callback = sinon_1.spy();
                game.addOutput("text", callback);
                game.start();
            });
            it("shouldn't play the second passage when the first isn't done", function () {
                expect(callback).to.have.been.calledWith("First", "2");
                expect(callback).not.to.have.been.calledWith("Second", "3");
            });
            it("should play the second passage after the first is done", function () {
                game.completePassage("2");
                expect(callback).to.have.been.calledWith("Second", "3");
            });
        });
        describe("when a passage has no content", function () {
            var first, second, game, callback;
            beforeEach(function () {
                first = {
                    "passageId": "1"
                };
                second = {
                    "passageId": "2",
                    "type": "text",
                    "content": "Second"
                };
                game = new game_1.Game({
                    "graph": {
                        "start": "1",
                        "nodes": {
                            "1": {
                                "nodeId": "1",
                                "passages": [first, second]
                            },
                        }
                    }
                });
                callback = sinon_1.spy();
                game.addOutput("text", callback);
                game.start();
            });
            it("should go on to the next passage", function () {
                expect(callback).to.have.been.calledWith("Second", "2");
            });
            context("when it's the last one in a node", function () {
                var first, second, game, callback;
                beforeEach(function () {
                    first = {
                        "passageId": "1"
                    };
                    second = {
                        "passageId": "2",
                        "type": "text",
                        "content": "Second"
                    };
                    game = new game_1.Game({
                        "graph": {
                            "start": "1",
                            "nodes": {
                                "1": {
                                    "nodeId": "1",
                                    "passages": [first],
                                    "choices": [{
                                            "nodeId": "2"
                                        }]
                                },
                                "2": {
                                    "nodeId": "2",
                                    "passages": [second]
                                },
                            }
                        }
                    });
                    callback = sinon_1.spy();
                    game.addOutput("text", callback);
                    game.start();
                });
                it("should go on to the next node", function () {
                    expect(callback).to.have.been.calledWith("Second", "2");
                });
            });
        });
        describe("when one of them should be skipped", function () {
            describe("when there are passages after the skipped one", function () {
                var first, second, game, callback;
                beforeEach(function () {
                    first = {
                        "passageId": "2",
                        "type": "text",
                        "content": "First",
                        "predicate": { foo: { lte: 0 } }
                    };
                });
                context("when the appropriate passage has no predicate", function () {
                    beforeEach(function () {
                        second = {
                            "passageId": "3",
                            "type": "text",
                            "content": "Second"
                        };
                        game = new game_1.Game({
                            "graph": {
                                "start": "1",
                                "nodes": {
                                    "1": {
                                        "nodeId": "1",
                                        "passages": [first, second]
                                    },
                                }
                            }
                        });
                        callback = sinon_1.spy();
                        game.addOutput("text", callback);
                        game.receiveInput("foo", true);
                    });
                    it("should go on to the next passage", function () {
                        game.start();
                        expect(callback).not.to.have.been.calledWith("First", "2");
                        expect(callback).to.have.been.calledWith("Second", "3");
                    });
                });
                context("when the appropriate passage has a matching predicate", function () {
                    beforeEach(function () {
                        second = {
                            "passageId": "3",
                            "type": "text",
                            "content": "Second",
                            "predicate": { bar: { gte: 1 } }
                        };
                        game = new game_1.Game({
                            "graph": {
                                "start": "1",
                                "nodes": {
                                    "1": {
                                        "nodeId": "1",
                                        "passages": [first, second]
                                    },
                                }
                            }
                        });
                        callback = sinon_1.spy();
                        game.addOutput("text", callback);
                        game.receiveInput("foo", 1);
                        game.receiveInput("bar", 1);
                    });
                    it("should go to the next passage", function () {
                        game.start();
                        expect(callback).not.to.have.been.calledWith("First", "2");
                        expect(callback).to.have.been.calledWith("Second", "3");
                    });
                });
            });
            describe("when the skipped passage is the last one", function () {
                it("should complete the node", function () {
                    var game = new game_1.Game({
                        "graph": {
                            "start": "1",
                            "nodes": {
                                "1": {
                                    "nodeId": "1",
                                    "passages": [{ passageId: "2", content: "Hi!", predicate: { foo: { exists: true } } }]
                                },
                            }
                        }
                    });
                    var callback = sinon_1.spy();
                    game.addOutput("text", callback);
                    game.start();
                    expect(callback).not.to.have.been.calledWith("Hi!", "2");
                    expect(game.state.graph.nodeComplete).to.be.true;
                });
            });
        });
    });
    context("when making a choice using a push-button variable", function () {
        var game, callback;
        beforeEach(function () {
            game = new game_1.Game({
                "graph": {
                    "start": "1",
                    "nodes": {
                        "1": {
                            "nodeId": "1",
                            "choices": [
                                {
                                    "nodeId": "2",
                                    "predicate": {
                                        "button": { "gte": 1 }
                                    }
                                }
                            ]
                        },
                        "2": {
                            "nodeId": "2",
                            "passages": [
                                {
                                    "passageId": "6",
                                    "type": "text",
                                    "content": "Goodbye World!"
                                }
                            ]
                        }
                    }
                }
            });
            callback = sinon_1.spy();
            game.addOutput("text", callback);
            game.start();
            game.receiveMomentaryInput("button");
        });
        it("should trigger the appropriate nodes", function () {
            expect(callback).to.have.been.calledWith("Goodbye World!", "6");
        });
        it("should not affect the actual variable", function () {
            expect(game.state.button).to.not.exist;
        });
        context("when a value is passed in", function () {
            beforeEach(function () {
                game = new game_1.Game({
                    "graph": {
                        "start": "1",
                        "nodes": {
                            "1": {
                                "nodeId": "1",
                                "choices": [
                                    {
                                        "nodeId": "2",
                                        "predicate": {
                                            "button": { "eq": "pushed!" }
                                        }
                                    }
                                ]
                            },
                            "2": {
                                "nodeId": "2",
                                "passages": [
                                    {
                                        "passageId": "6",
                                        "type": "text",
                                        "content": "Goodbye World!"
                                    }
                                ]
                            }
                        }
                    }
                });
                callback = sinon_1.spy();
                game.addOutput("text", callback);
                game.start();
                game.receiveMomentaryInput("button", "pushed!");
            });
            it("should trigger the appropriate nodes", function () {
                expect(callback).to.have.been.calledWith("Goodbye World!", "6");
            });
            it("should not affect the actual variable", function () {
                expect(game.state.button).to.not.exist;
            });
        });
    });
    context("when making a choice", function () {
        var game, callback;
        beforeEach(function () {
            game = new game_1.Game({
                "graph": {
                    "start": "1",
                    "nodes": {
                        "1": {
                            "nodeId": "1",
                            "passages": [
                                {
                                    "passageId": "5",
                                    "type": "text",
                                    "content": "foobar"
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
                            "nodeId": "2",
                            "passages": [
                                {
                                    "passageId": "6",
                                    "type": "text",
                                    "content": "Goodbye World!"
                                }
                            ]
                        }
                    }
                }
            });
            callback = sinon_1.spy();
            game.addOutput("text", callback);
            game.start();
        });
        describe("waiting for the node to complete", function () {
            context("when the output needs to finish first", function () {
                it("shouldn't change nodes until the content finishes", function () {
                    game.receiveInput("counter", 11);
                    expect(callback).not.to.have.been.calledWith("Goodbye World!", "6");
                    expect(game.state.graph.currentNodeId).to.equal("1");
                });
            });
            context("when the output has finished", function () {
                it("should play the appropriate new content", function () {
                    game.completePassage("5");
                    game.receiveInput("counter", 11);
                    expect(callback).to.have.been.calledWith("Goodbye World!", "6");
                });
            });
        });
        describe("when the predicate has multiple conditions", function () {
            beforeEach(function () {
                game = new game_1.Game({
                    "graph": {
                        "start": "1",
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
                                            "counter": { "gte": 10, "lte": 15 }
                                        }
                                    }
                                ]
                            },
                            "2": {
                                "nodeId": "2",
                                "passages": [{
                                        "passageId": "1",
                                        "content": "Hi",
                                        "type": "text"
                                    }]
                            }
                        }
                    }
                });
                callback = sinon_1.spy();
                game.addOutput("text", callback);
                game.start();
                game.completePassage("5");
            });
            it("shouldn't transition when only one condition is met", function () {
                game.receiveInput("counter", 9);
                expect(callback).not.to.have.been.calledWith("Hi", "1");
            });
            it("shouldn't transition when only the other condition is met", function () {
                game.receiveInput("counter", 16);
                expect(callback).not.to.have.been.calledWith("Hi", "1");
            });
            it("should transition when both conditions are met", function () {
                game.receiveInput("counter", 12);
                expect(callback).to.have.been.calledWith("Hi", "1");
            });
        });
    });
    context("when a choice is triggered by an in-passage variable set", function () {
        var game, callback;
        beforeEach(function () {
            game = new game_1.Game({
                "graph": {
                    "start": "1",
                    "nodes": {
                        "1": {
                            "nodeId": "1",
                            "passages": [
                                {
                                    "passageId": "5",
                                    "type": "text",
                                    "content": "Hi!",
                                    "set": {
                                        "foo": 1
                                    }
                                }
                            ],
                            "choices": [
                                {
                                    "nodeId": "2",
                                    "predicate": {
                                        "foo": { "gte": 1 }
                                    }
                                }
                            ]
                        },
                        "2": {
                            "nodeId": "2",
                            "passages": [
                                {
                                    "passageId": "6",
                                    "type": "text",
                                    "content": "Goodbye World!"
                                }
                            ]
                        }
                    }
                }
            });
            callback = sinon_1.spy();
            game.addOutput("text", callback);
            game.start();
        });
        it("shouldn't change until the passage has ended", function () {
            expect(callback).not.to.have.been.calledWith("Goodbye World!", "6");
            expect(game.state.graph.currentNodeId).to.equal("1");
        });
        it("should change after the passage has ended", function () {
            game.completePassage("5");
            expect(callback).to.have.been.calledWith("Goodbye World!", "6");
            expect(game.state.graph.currentNodeId).to.equal("2");
        });
    });
});
describe("triggering events from the bag", function () {
    context("when the game hasn't started yet", function () {
        var node, game, output;
        beforeEach(function () {
            node = {
                nodeId: "5",
                predicate: { "foo": { "lte": 10 } },
                passages: [
                    {
                        "passageId": "1",
                        "type": "text",
                        "content": "What do you want?"
                    },
                    {
                        "passageId": "2",
                        "type": "text",
                        "content": "Well let me tell you!"
                    }
                ]
            };
            game = new game_1.Game({
                "bag": { "5": node }
            });
            output = sinon_1.spy();
            game.addOutput("text", output);
            game.receiveInput("foo", 7);
        });
        it("shouldn't do anything", function () {
            expect(output).not.to.have.been.calledOnce;
        });
    });
    describe("different ways to trigger an event", function () {
        context("when the game starts without a start", function () {
            var game, node, output;
            beforeEach(function () {
                node = {
                    nodeId: "1",
                    passages: [
                        {
                            "passageId": "1",
                            "type": "text",
                            "content": "First"
                        }
                    ]
                };
                game = new game_1.Game({
                    "bag": { "1": node }
                });
                output = sinon_1.spy();
                game.addOutput("text", output);
                game.start();
            });
            it("should play a valid event node", function () {
                expect(output).to.have.been.calledWith("First", "1");
            });
        });
        context("triggered by an input change", function () {
            var node, game, output;
            beforeEach(function () {
                node = {
                    nodeId: "5",
                    predicate: { "foo": { "lte": 10 } },
                    passages: [
                        {
                            "passageId": "1",
                            "type": "text",
                            "content": "What do you want?"
                        },
                        {
                            "passageId": "2",
                            "type": "text",
                            "content": "Well let me tell you!"
                        }
                    ]
                };
                game = new game_1.Game({
                    "bag": { "5": node }
                });
                output = sinon_1.spy();
                game.addOutput("text", output);
                game.start();
                game.receiveInput("foo", 7);
            });
            it("should trigger that node", function () {
                expect(output).to.have.been.calledWith("What do you want?", "1");
            });
            it("should not trigger the second passage yet", function () {
                expect(output).not.to.have.been.calledWith("Well let me tell you!", "2");
            });
            describe("when the first passage is done", function () {
                it("should play the next passage", function () {
                    game.completePassage("1");
                    expect(output).to.have.been.calledWith("Well let me tell you!", "2");
                });
            });
        });
        context("triggered by a push-button input", function () {
            var node, game, output;
            beforeEach(function () {
                node = {
                    nodeId: "5",
                    predicate: { "button": { "gte": 1 } },
                    passages: [
                        {
                            "passageId": "1",
                            "type": "text",
                            "content": "What do you want?"
                        }
                    ]
                };
                game = new game_1.Game({
                    "bag": { "5": node }
                });
                output = sinon_1.spy();
                game.addOutput("text", output);
                game.start();
                game.receiveMomentaryInput("button");
            });
            it("should trigger that node", function () {
                expect(output).to.have.been.calledWith("What do you want?", "1");
            });
            it("should not change the global state", function () {
                expect(game.state.button).to.not.exist;
            });
        });
        context("triggered by a graph node being completed", function () {
            var node, game, output;
            beforeEach(function () {
                node = {
                    nodeId: "5",
                    predicate: { "graph.nodeComplete": { "gte": 1 } },
                    passages: [
                        {
                            "passageId": "1",
                            "type": "text",
                            "content": "Hello"
                        }
                    ]
                };
                game = new game_1.Game({
                    bag: { "5": node },
                    graph: {
                        start: "4",
                        nodes: {
                            "4": {
                                nodeId: "4",
                                passages: [{
                                        passageId: "2",
                                        type: "text",
                                        content: "foobar"
                                    }]
                            }
                        }
                    }
                });
                output = sinon_1.spy();
                game.addOutput("text", output);
                game.start();
            });
            it("should not trigger the node initially", function () {
                expect(output).not.to.have.been.calledWith("Hello", "1");
            });
            describe("when the graph node is complete", function () {
                it("should play the bag node", function () {
                    game.completePassage("2");
                    expect(output).to.have.been.calledWith("Hello", "1");
                });
            });
        });
        context("triggered by reaching a specific graph node", function () {
            var node, game, output;
            beforeEach(function () {
                node = {
                    nodeId: "5",
                    predicate: {
                        "graph.currentNodeId": { gte: "2", lte: "2" }
                    },
                    passages: [
                        {
                            "passageId": "1",
                            "type": "text",
                            "content": "Hello"
                        }
                    ]
                };
                game = new game_1.Game({
                    bag: { "5": node },
                    graph: {
                        start: "4",
                        nodes: {
                            "4": {
                                nodeId: "4",
                                passages: [{
                                        passageId: "2",
                                        type: "text",
                                        content: "hi"
                                    }],
                                choices: [{
                                        nodeId: "2",
                                        predicate: { "foo": { exists: false } }
                                    }]
                            },
                            "2": {
                                nodeId: "2",
                                passages: [{
                                        passageId: "3",
                                        type: "text",
                                        content: "hi"
                                    }]
                            }
                        }
                    }
                });
                output = sinon_1.spy();
                game.addOutput("text", output);
                game.start();
            });
            it("should not trigger the node initially", function () {
                expect(output).not.to.have.been.calledWith("Hello", "1");
            });
            describe("when the target graph node hasn't been completed", function () {
                it("should trigger the bag node", function () {
                    game.completePassage("2");
                    expect(output).to.have.been.calledWith("Hello", "1");
                });
            });
        });
    });
    describe("triggering the same node multiple times", function () {
        context("when the node should only trigger once", function () {
            var game, node, output;
            beforeEach(function () {
                node = {
                    nodeId: "5",
                    predicate: { "foo": { "lte": 10 } },
                    passages: [
                        {
                            "passageId": "1",
                            "type": "text",
                            "content": "Something"
                        }
                    ]
                };
                game = new game_1.Game({
                    "bag": { "5": node }
                });
                output = sinon_1.spy();
                game.addOutput("text", output);
                game.start();
            });
            it("shouldn't play a second time while it's still playing the first time", function () {
                game.receiveInput("foo", 7);
                game.receiveInput("foo", 7);
                expect(output).to.have.been.calledOnce;
            });
            it("shouldn't play even after the first time has completed", function () {
                game.receiveInput("foo", 7);
                game.completePassage("1");
                game.receiveInput("foo", 7);
                expect(output).to.have.been.calledOnce;
            });
        });
        context("when the node should trigger multiple times", function () {
            var game, node, output;
            beforeEach(function () {
                node = {
                    nodeId: "5",
                    allowRepeats: true,
                    predicate: { "foo": { "lte": 10 } },
                    passages: [
                        {
                            "passageId": "1",
                            "type": "text",
                            "content": "Something"
                        }
                    ]
                };
                game = new game_1.Game({
                    "bag": { "5": node }
                });
                output = sinon_1.spy();
                game.addOutput("text", output);
                game.start();
            });
            it("shouldn't play a second time while it's still playing the first time", function () {
                game.receiveInput("foo", 7);
                game.receiveInput("foo", 7);
                expect(output).to.have.been.calledOnce;
            });
            it("should allow playing a second time", function () {
                game.receiveInput("foo", 7);
                game.completePassage("1");
                game.receiveInput("foo", 7);
                expect(output).to.have.been.calledTwice;
            });
        });
    });
    context("when there are multiple valid nodes", function () {
        context("when they both belong to the default track", function () {
            var game, node1, node2, output;
            beforeEach(function () {
                node1 = {
                    nodeId: "1",
                    passages: [
                        {
                            "passageId": "1",
                            "type": "text",
                            "content": "First"
                        }
                    ]
                };
                node2 = {
                    nodeId: "2",
                    passages: [
                        {
                            "passageId": "2",
                            "type": "text",
                            "content": "Second"
                        }
                    ]
                };
                game = new game_1.Game({
                    "bag": { "1": node1, "2": node2 }
                });
                output = sinon_1.spy();
                game.addOutput("text", output);
                game.start();
            });
            it("should only play one of them at once", function () {
                // NOTE: This test takes advantage of the implementation detail.
                // If a bunch of potential nodes can be triggered, the engine currently picks the first one.
                // This may change in the future, and this test will fail as a result.
                expect(output).to.have.been.calledOnce;
                expect(output).to.have.been.calledWith("First", "1");
            });
        });
        context("when they belong to the same track", function () {
            var game, node1, node2, output;
            beforeEach(function () {
                node1 = {
                    nodeId: "1",
                    track: "primary",
                    passages: [
                        {
                            "passageId": "1",
                            "type": "text",
                            "content": "First"
                        }
                    ]
                };
                node2 = {
                    nodeId: "2",
                    track: "primary",
                    passages: [
                        {
                            "passageId": "2",
                            "type": "text",
                            "content": "Second"
                        }
                    ]
                };
                game = new game_1.Game({
                    "bag": { "1": node1, "2": node2 }
                });
                output = sinon_1.spy();
                game.addOutput("text", output);
                game.start();
            });
            it("should only play one of them at once", function () {
                // NOTE: This test takes advantage of the implementation detail.
                // If a bunch of potential nodes can be triggered, the engine currently picks the first one.
                // This may change in the future, and this test will fail as a result.
                expect(output).to.have.been.calledOnce;
                expect(output).to.have.been.calledWith("First", "1");
            });
        });
        context("when they belong to different tracks", function () {
            var game, node1, node2, output;
            beforeEach(function () {
                node1 = {
                    nodeId: "1",
                    track: "primary",
                    passages: [
                        {
                            "passageId": "1",
                            "type": "text",
                            "content": "primary track!"
                        }
                    ]
                };
                node2 = {
                    nodeId: "2",
                    track: "music",
                    passages: [
                        {
                            "passageId": "2",
                            "type": "text",
                            "content": "secondary track!"
                        }
                    ]
                };
                game = new game_1.Game({
                    "bag": { "1": node1, "2": node2 }
                });
                output = sinon_1.spy();
                game.addOutput("text", output);
                game.start();
            });
            it("should play both of them", function () {
                expect(output).to.have.been.calledTwice;
                expect(output).to.have.been.calledWith("primary track!", "1");
                expect(output).to.have.been.calledWith("secondary track!", "2");
            });
        });
    });
});
describe("receiving input", function () {
    context("when the input variable is a keypath", function () {
        context("when the keypath exists", function () {
            var game;
            beforeEach(function () {
                game = new game_1.Game({});
                game.state.foo = {};
                game.receiveInput("foo.bar", "baz");
            });
            it("should create the appropriate state", function () {
                expect(game.state.foo.bar).to.equal("baz");
            });
            it("should not create the wrong variable", function () {
                expect(game.state["foo.bar"]).to.not.exist;
            });
        });
        // TODO: This behavior should eventually match the previous test case
        context("when the keypath doesn't exist", function () {
            var game;
            beforeEach(function () {
                game = new game_1.Game({});
                game.receiveInput("foo.bar", "baz");
            });
            it("should create a variable with a period", function () {
                expect(game.state["foo.bar"]).to.equal("baz");
            });
        });
    });
    context("when the input data is an object", function () {
        it("should set the object", function () {
            var game = new game_1.Game({});
            game.receiveInput("foo", { "bar": "baz" });
            expect(game.state.foo.bar).to.equal("baz");
        });
    });
});
// TODO: Find somewhere else for these to live?
describe("receiveDispatch", function () {
    // TODO: Backfill this out
    describe("MAKE_GRAPH_CHOICE", function () {
        var choice1, choice2, game;
        beforeEach(function () {
            choice1 = { nodeId: "3" };
            choice2 = { nodeId: "4" };
            game = new game_1.Game({
                graph: {
                    nodes: {
                        2: { nodeId: "2" },
                        3: { nodeId: "3", "passages": [] },
                        4: { nodeId: "4", "passages": [] }
                    }
                }
            });
            game.state.graph.currentNodeId = "2";
            game.receiveDispatch(Actions.MAKE_GRAPH_CHOICE, choice1);
            game.receiveDispatch(Actions.MAKE_GRAPH_CHOICE, choice2);
        });
        it("should update the previousChoice with the most recent choice", function () {
            expect(game.state.graph.previousChoice).to.eql(choice2);
        });
        it("should store the full choice history in reverse-chronological order", function () {
            expect(game.state.graph.choiceHistory).to.eql([choice2, choice1]);
        });
        it("should store the previous nodeId", function () {
            expect(game.state.graph.previousNodeId).to.equal("3");
        });
        it("should store the full node history in reverse-chronological order", function () {
            expect(game.state.graph.nodeHistory).to.eql(["3", "2"]);
        });
    });
    // TODO:
    // COMPLETE_BAG_NODE now relies on more of the state graph than is being exposed in this tiny harness.
    // I could hack it to work now, but I need to think more about the value and structure of these unit-level tests in general
    describe.skip("COMPLETE_BAG_NODE", function () {
        it("should remove the node from the list of active bag passages", function () {
            var game = new game_1.Game({});
            game.state.bag.activePassageIndexes["1"] = 0;
            game.receiveDispatch(Actions.COMPLETE_BAG_NODE, "1");
            expect(game.state.bag.activePassageIndexes["1"]).to.be.undefined;
        });
        it("should trigger a sweep of new bag nodes", function () {
            // TODO: I'm not sure this is a valuable test!
            var game = new game_1.Game({});
            sinon_1.stub(game.story.bag, "checkNodes");
            game.receiveDispatch(Actions.COMPLETE_BAG_NODE, "1");
            expect(game.story.bag.checkNodes).to.have.been.calledWith(game.state);
        });
        context("when the node has never been visited before", function () {
            it("should add it to the bag node history", function () {
                var game = new game_1.Game({});
                expect(game.state.bag.nodeHistory["1"]).to.be.undefined;
                game.receiveDispatch(Actions.COMPLETE_BAG_NODE, "1");
                expect(game.state.bag.nodeHistory["1"]).to.equal(1);
            });
        });
        context("when the node has been visited before", function () {
            it("should increment its node history", function () {
                var game = new game_1.Game({});
                game.receiveDispatch(Actions.COMPLETE_BAG_NODE, "1");
                game.receiveDispatch(Actions.COMPLETE_BAG_NODE, "1");
                expect(game.state.bag.nodeHistory["1"]).to.equal(2);
            });
        });
    });
    describe("OUTPUT", function () {
        describe("selecting outputs", function () {
            var textOutput1, textOutput2, audioOutput, game, passage;
            beforeEach(function () {
                textOutput1 = sinon_1.spy();
                textOutput2 = sinon_1.spy();
                audioOutput = sinon_1.spy();
                game = new game_1.Game({});
                game.addOutput("text", textOutput1);
                game.addOutput("text", textOutput2);
                game.addOutput("audio", audioOutput);
                passage = {
                    "passageId": "5",
                    "content": "Hello World!",
                    "type": "text"
                };
                game.receiveDispatch(Actions.OUTPUT, passage);
            });
            it("should send output to all registered outputs of that type", function () {
                expect(textOutput1).to.have.been.calledWith("Hello World!", "5");
                expect(textOutput2).to.have.been.calledWith("Hello World!", "5");
            });
            it("should only send output to outputs of the same type", function () {
                expect(audioOutput).not.to.have.been.calledWith("Hello World!", "5");
            });
        });
        it("should evaluate all embedded variables", function () {
            var game = new game_1.Game({});
            var output = sinon_1.spy();
            var passage = {
                "passageId": "5",
                "content": "Hello {yourName}, it's {myName}!",
                "type": "text"
            };
            game.state.yourName = "Stanley";
            game.state.myName = "Ollie";
            game.addOutput("text", output);
            game.receiveDispatch(Actions.OUTPUT, passage);
            expect(output).to.have.been.calledWith("Hello Stanley, it's Ollie!", "5");
        });
        it("should allow nested keypaths in variables", function () {
            var game = new game_1.Game({});
            var output = sinon_1.spy();
            var passage = {
                "passageId": "5",
                "content": "You're in node {graph.currentNodeId}!",
                "type": "text"
            };
            game.state.graph.currentNodeId = "1";
            game.addOutput("text", output);
            game.receiveDispatch(Actions.OUTPUT, passage);
            expect(output).to.have.been.calledWith("You're in node 1!", "5");
        });
    });
});
