function newCryptoEcosystemFunctions() {
    thisObject = {
        addMissingExchanges: addMissingExchanges,
        addMissingAssets: addMissingAssets,
        addMissingMarkets: addMissingMarkets,
        installMarket: installMarket,
        uninstallMarket: uninstallMarket
    }

    return thisObject

    function addMissingExchanges(node, functionLibraryUiObjectsFromNodes) {
        currentExchanges = new Map()
        let parent = node.payload.parentNode
        if (parent !== undefined) {
            for (let i = 0; i < parent.cryptoExchanges.length; i++) {
                let cryptoExchanges = parent.cryptoExchanges[i]
                for (let j = 0; j < cryptoExchanges.exchanges.length; j++) {
                    let exchange = cryptoExchanges.exchanges[j]
                    let codeName = loadPropertyFromNodeConfig(exchange.payload, 'codeName')
                    currentExchanges.set(codeName, exchange)
                }
            }
        }

        let params = {
            method: 'listExchanges',
            has: {
                fetchOHLCV: true,
                fetchMarkets: true
            }
        }

        callServer(JSON.stringify(params), 'CCXT', onResponse)

        function onResponse(err, data) {
            if (err.result !== GLOBAL.DEFAULT_OK_RESPONSE.result) {
                node.payload.uiObject.setErrorMessage('Failed to Fetch Assets from the Exchange')
                return
            }

            let exchanges = JSON.parse(data)
            for (let i = 0; i < exchanges.length; i++) {
                let exchange = exchanges[i]
                let existingExchange = currentExchanges.get(exchange.id)
                if (existingExchange === undefined) {
                    let newExchange = functionLibraryUiObjectsFromNodes.addUIObject(node, 'Crypto Exchange')
                    newExchange.name = exchange.name
                    newExchange.config = '{ \n\"codeName\": \"' + exchange.id + '\"\n}'
                    newExchange.payload.floatingObject.collapseToggle()
                    newExchange.exchangeAssets.payload.floatingObject.angleToParent = ANGLE_TO_PARENT.RANGE_180
                    newExchange.exchangeMarkets.payload.floatingObject.angleToParent = ANGLE_TO_PARENT.RANGE_180
                    newExchange.exchangeAccounts.payload.floatingObject.angleToParent = ANGLE_TO_PARENT.RANGE_180
                    newExchange.exchangeAssets.payload.floatingObject.distanceToParent = DISTANCE_TO_PARENT.PARENT_050X
                    newExchange.exchangeMarkets.payload.floatingObject.distanceToParent = DISTANCE_TO_PARENT.PARENT_100X
                    newExchange.exchangeAccounts.payload.floatingObject.distanceToParent = DISTANCE_TO_PARENT.PARENT_025X
                    newExchange.exchangeAssets.payload.floatingObject.arrangementStyle = ARRANGEMENT_STYLE.CONCAVE
                    newExchange.exchangeMarkets.payload.floatingObject.arrangementStyle = ARRANGEMENT_STYLE.CONCAVE
                    newExchange.exchangeAccounts.payload.floatingObject.arrangementStyle = ARRANGEMENT_STYLE.CONCAVE
                }
            }
        }
    }

    function addMissingAssets(node, functionLibraryUiObjectsFromNodes) {
        if (node.payload.parentNode === undefined) { return }

        let currentAssets = new Map()
        for (let j = 0; j < node.assets.length; j++) {
            let asset = node.assets[j]
            let codeName = loadPropertyFromNodeConfig(asset.payload, 'codeName')
            currentAssets.set(codeName, asset)
        }

        let exchangeId = loadPropertyFromNodeConfig(node.payload.parentNode.payload, 'codeName')

        try {
            let params = {
                exchangeId: exchangeId,
                method: 'fetchMarkets'
            }
            callServer(JSON.stringify(params), 'CCXT', onResponse)

            function onResponse(err, data) {
                if (err.result !== GLOBAL.DEFAULT_OK_RESPONSE.result) {
                    node.payload.uiObject.setErrorMessage('Failed to Fetch Assets from the Exchange')
                    return
                }
                let queryParams = loadPropertyFromNodeConfig(node.payload, 'addMissingAssets')

                let markets = JSON.parse(data)
                for (let i = 0; i < markets.length; i++) {
                    let market = markets[i]

                    if (queryParams !== undefined) {
                        if (queryParams.baseAsset !== undefined) {
                            if (market.base.indexOf(queryParams.baseAsset) < 0) {
                                continue
                            }
                        }
                        if (queryParams.quotedAsset !== undefined) {
                            if (market.quote.indexOf(queryParams.quotedAsset) < 0) {
                                continue
                            }
                        }
                    }
                    if (currentAssets.get(market.base) === undefined) {
                        addAsset(market.base)
                        currentAssets.set(market.base, market.base)
                    }
                    if (currentAssets.get(market.quote) === undefined) {
                        addAsset(market.quote)
                        currentAssets.set(market.quote, market.quote)
                    }

                    function addAsset(name) {
                        let newAsseet = functionLibraryUiObjectsFromNodes.addUIObject(node, 'Asset')
                        newAsseet.name = name
                        newAsseet.config = '{ \n\"codeName\": \"' + name + '\"\n}'
                    }
                }
            }
        } catch (err) {
            node.payload.uiObject.setErrorMessage('Failed to Fetch Assets from the Exchange')
            console.log(err.stack)
        }
    }

    function addMissingMarkets(node, functionLibraryUiObjectsFromNodes, functionLibraryNodeCloning) {
        if (node.payload.parentNode === undefined) { return }
        if (node.payload.parentNode.exchangeAssets === undefined) { return }
        if (node.payload.parentNode.payload.parentNode === undefined) { return }
        if (node.payload.parentNode.payload.parentNode.payload.parentNode === undefined) { return }

        let currentAssets = new Map()
        let exchangeAssets = node.payload.parentNode.exchangeAssets
        for (let j = 0; j < exchangeAssets.assets.length; j++) {
            let asset = exchangeAssets.assets[j]
            let codeName = loadPropertyFromNodeConfig(asset.payload, 'codeName')
            currentAssets.set(codeName, asset)
        }

        let currentMarkets = new Map()
        let exchangeMarkets = node
        for (let j = 0; j < exchangeMarkets.markets.length; j++) {
            let asset = exchangeMarkets.markets[j]
            let codeName = loadPropertyFromNodeConfig(asset.payload, 'codeName')
            currentMarkets.set(codeName, asset)
        }

        let exchangeId = loadPropertyFromNodeConfig(node.payload.parentNode.payload, 'codeName')

        try {
            let params = {
                exchangeId: exchangeId,
                method: 'fetchMarkets'
            }
            callServer(JSON.stringify(params), 'CCXT', onResponse)

            function onResponse(err, data) {
                if (err.result !== GLOBAL.DEFAULT_OK_RESPONSE.result) {
                    node.payload.uiObject.setErrorMessage('Failed to Fetch Assets from the Exchange')
                    return
                }

                let markets = JSON.parse(data)
                for (let i = 0; i < markets.length; i++) {
                    let market = markets[i]
                    let baseAsset = currentAssets.get(market.base)
                    let quotedAsset = currentAssets.get(market.quote)

                    if (baseAsset === undefined) {
                        continue
                    }
                    if (quotedAsset === undefined) {
                        continue
                    }

                    if (currentMarkets.get(market.symbol) === undefined) {
                        addMarket(market.symbol, baseAsset, quotedAsset)
                    }

                    function addMarket(name, baseAsset, quotedAsset) {
                        let newMarket = functionLibraryUiObjectsFromNodes.addUIObject(node, 'Market')
                        newMarket.name = name
                        newMarket.config = '{ \n\"codeName\": \"' + name + '\"\n}'
                        newMarket.payload.floatingObject.angleToParent = ANGLE_TO_PARENT.RANGE_180
                        newMarket.payload.floatingObject.distanceToParent = DISTANCE_TO_PARENT.PARENT_100X
                        newMarket.payload.floatingObject.arrangementStyle = ARRANGEMENT_STYLE.CONCAVE
                        newMarket.baseAsset.payload.floatingObject.angleToParent = ANGLE_TO_PARENT.RANGE_45
                        newMarket.quotedAsset.payload.floatingObject.angleToParent = ANGLE_TO_PARENT.RANGE_45
                        newMarket.baseAsset.payload.floatingObject.distanceToParent = DISTANCE_TO_PARENT.PARENT_100X
                        newMarket.quotedAsset.payload.floatingObject.distanceToParent = DISTANCE_TO_PARENT.PARENT_100X
                        newMarket.baseAsset.payload.floatingObject.arrangementStyle = ARRANGEMENT_STYLE.CONCAVE
                        newMarket.quotedAsset.payload.floatingObject.arrangementStyle = ARRANGEMENT_STYLE.CONCAVE
                        newMarket.baseAsset.payload.referenceParent = baseAsset
                        newMarket.quotedAsset.payload.referenceParent = quotedAsset

                        currentMarkets.set(name, newMarket)
                    }
                }
            }
        } catch (err) {
            node.payload.uiObject.setErrorMessage('Failed to Fetch Assets from the Exchange')
            console.log(err.stack)
        }
    }

    function installMarket(node, rootNodes, functionLibraryUiObjectsFromNodes, functionLibraryNodeDeleter, functionLibraryChartingSpaceFunctions, functionLibraryDataStorageFunctions) {

        let market = node
        let cryptoExchange = findNodeInNodeMesh(node, 'Crypto Exchange', undefined, true, false, true, false)
        if (cryptoExchange === undefined) {
            node.payload.uiObject.setErrorMessage('Market must be a descendant of a Crypto Exchange')
            return
        }
        let dashboardsArray = []

        for (let i = 0; i < rootNodes.length; i++) {
            let rootNode = rootNodes[i]
            if (rootNode.type === 'Network') {
                installInNetwork(rootNode)
            }
        }

        for (let i = 0; i < rootNodes.length; i++) {
            let rootNode = rootNodes[i]
            if (rootNode.type === 'Charting Space') {
                installInChartingSpace(rootNode)
            }
        }

        function installInNetwork(network) {

            for (let j = 0; j < network.networkNodes.length; j++) {
                let networkNode = network.networkNodes[j]
                installInNetworkNode(networkNode)
            }

            function installInNetworkNode(networkNode) {
                /*
                Here we complete the missing stuff at Data Mining
                */
                let dataMining = findInBranch(networkNode, 'Data Mining', node, true)
                if (dataMining === undefined) {
                    node.payload.uiObject.setErrorMessage('Data Mining node not found at Network Node ' + networkNode.name)
                    return
                }

                let exchangeDataTasks = findOrCreateChildWithReference(dataMining, 'Exchange Data Tasks', cryptoExchange, functionLibraryUiObjectsFromNodes)
                exchangeDataTasks.payload.floatingObject.angleToParent = ANGLE_TO_PARENT.RANGE_180
                let marketDataTask = findAndRecreateChildWithReference(exchangeDataTasks, 'Market Data Tasks', market, rootNodes, functionLibraryUiObjectsFromNodes, functionLibraryNodeDeleter)

                menuClick(marketDataTask, 'Add Missing Data Mine Tasks', true)
                menuClickOfNodeArray(marketDataTask.dataMineTasks, 'Add All Tasks', true)

                let sessionsCreatedArray = []
                /*
                Next we complete the missing stuff at Testing Environment
                */
                installEnvironment('Testing Environment')
                /*
                Next we complete the missing stuff at Production Environment
                */
                installEnvironment('Production Environment')

                function installEnvironment(environment) {
                    /*
                    Now we install the environmnet at the current Network Node
                    */
                    let environmentFound = findInBranch(networkNode, environment, node, true)
                    if (environmentFound === undefined) {
                        node.payload.uiObject.setErrorMessage(environment + ' node not found at Network Node ' + networkNode.name)
                        return
                    }

                    let exchangeTradingTasks = findOrCreateChildWithReference(environmentFound, 'Exchange Trading Tasks', cryptoExchange, functionLibraryUiObjectsFromNodes)
                    exchangeTradingTasks.payload.floatingObject.angleToParent = ANGLE_TO_PARENT.RANGE_180
                    let marketTradingTask = findAndRecreateChildWithReference(exchangeTradingTasks, 'Market Trading Tasks', market, rootNodes, functionLibraryUiObjectsFromNodes, functionLibraryNodeDeleter)

                    menuClick(marketTradingTask, 'Add Missing Trading Mine Tasks', true)
                    menuClickOfNodeArray(marketTradingTask.tradingMineTasks, 'Add All Tasks', true)

                    /* This will be needed at the charging space, for creating Dashboards */
                    let backtestingSessionsArray = nodeBranchToArray(marketTradingTask, 'Backtesting Session')
                    let liveTradingSessionsArray = nodeBranchToArray(marketTradingTask, 'Live Trading Session')
                    let allSessionsArray = backtestingSessionsArray.concat(liveTradingSessionsArray)
                    sessionsCreatedArray = sessionsCreatedArray.concat(allSessionsArray)

                    dashboardsArray.push({ environmentNode: environmentFound, networkNode: networkNode, sessionsArray: allSessionsArray })
                }
                /*
                Here we complete the missing stuff at Session Independent Data
                */
                let sessionIndependentData = findInBranch(networkNode, 'Session Independent Data', node, true)
                if (sessionIndependentData === undefined) {
                    node.payload.uiObject.setErrorMessage('Session Independent Data node not found at Network Node ' + networkNode.name)
                    return
                }

                let exchangeDataProducts = findOrCreateChildWithReference(sessionIndependentData, 'Exchange Data Products', cryptoExchange, functionLibraryUiObjectsFromNodes)
                exchangeDataProducts.payload.floatingObject.angleToParent = ANGLE_TO_PARENT.RANGE_180
                let singleMarketData = findAndRecreateChildWithReference(exchangeDataProducts, 'Single Market Data', market, rootNodes, functionLibraryUiObjectsFromNodes, functionLibraryNodeDeleter)
                singleMarketData.payload.floatingObject.collapseToggle()

                menuClick(singleMarketData, 'Add All Data Mine Products', true)
                menuClickOfNodeArray(singleMarketData.dataMineProducts, 'Add All Data Products', true)
                /*
                Finally we complete the missing stuff at Session Based Data
                */
                let sessionBasedData = findInBranch(networkNode, 'Session Based Data', node, true)
                if (sessionBasedData === undefined) {
                    node.payload.uiObject.setErrorMessage('Session Based Data node not found at Network Node ' + networkNode.name)
                    return
                }

                let exchangeSessions = findOrCreateChildWithReference(sessionBasedData, 'Exchange Sessions', cryptoExchange, functionLibraryUiObjectsFromNodes)
                exchangeSessions.payload.floatingObject.angleToParent = ANGLE_TO_PARENT.RANGE_180
                /*
                We need to delete all the session references related to the market we are installing.
                We make a copy of the array so that if we need to delete some nodes it does not 
                affect the loop evaluating the nodes.
                */
               let sessionReferencesArray = []
                for (let i = 0; i < exchangeSessions.sessionReferences.length; i++) {
                    sessionReference = exchangeSessions.sessionReferences[i]
                    sessionReferencesArray.push(sessionReference)
                }
                for (let i = 0; i < sessionReferencesArray.length; i++) {
                    sessionReference = sessionReferencesArray[i]
                    if (sessionReference.singleMarketTradingData === undefined) { continue }
                    if (sessionReference.singleMarketTradingData.payload.referenceParent === undefined) { continue }
                    if (sessionReference.singleMarketTradingData.payload.referenceParent.id === node.id) {
                        functionLibraryNodeDeleter.deleteUIObject(sessionReference, rootNodes)
                    }
                }
                /*
                Create the new session references.
                */
                for (let i = 0; i < sessionsCreatedArray.length; i++) {
                    let session = sessionsCreatedArray[i]
                    if (isMissingChildren(exchangeSessions, session, true) === true) {
                        functionLibraryDataStorageFunctions.createSessionReference(exchangeSessions, session, functionLibraryUiObjectsFromNodes)
                    }
                }
                /*
                Create everything inside the session references.
                */
                for (let j = 0; j < exchangeSessions.sessionReferences.length; j++) {
                    sessionReference = exchangeSessions.sessionReferences[j]
                    menuClick(sessionReference.singleMarketTradingData, 'Add All Trading Mine Products', true)
                    menuClickOfNodeArray(sessionReference.singleMarketTradingData.tradingMineProducts, 'Add All Data Products', true)
                    sessionReference.singleMarketTradingData.payload.floatingObject.collapseToggle()
                }
            }
        }

        function installInChartingSpace(chartingSpace) {

            for (let i = 0; i < dashboardsArray.length; i++) {
                let arrayItem = dashboardsArray[i]
                let dashboard = findOrCreateChildWithReference(chartingSpace, 'Dashboard', arrayItem.environmentNode, functionLibraryUiObjectsFromNodes)
                dashboard.name = arrayItem.environmentNode.type + ' ' + arrayItem.networkNode.name

                for (let j = 0; j < arrayItem.sessionsArray.length; j++) {
                    let session = arrayItem.sessionsArray[j]
                    functionLibraryChartingSpaceFunctions.createTimeMachine(dashboard, session, node, arrayItem.networkNode, rootNodes, functionLibraryUiObjectsFromNodes, functionLibraryNodeDeleter)
                }
            }
        }
    }

    function uninstallMarket(node, rootNodes, functionLibraryUiObjectsFromNodes, functionLibraryNodeDeleter, functionLibraryChartingSpaceFunctions, functionLibraryDataStorageFunctions) {

    }
}
