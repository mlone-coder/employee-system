window.submitOrder = async () => { 
    const t = document.getElementById('tableNum').value; 
    // 检查桌号
    if(!t) return window.showPop(I18N[currentLang].err_table, null, false, true); 
    
    // 如果购物车是空的，不发送
    if(cart.length === 0) return;

    // --- 1. 生成给历史记录看的长字符串 ---
    const ds = cart.map(it => `${it.name}${it.qty > 1 ? 'x' + it.qty : ''} ${it.displayMods}`).join(', '); 
    
    // --- 2. 【核心修复】生成厨房系统需要的 items 清单 ---
    // 这样厨房系统才能一行一行显示菜品和饮料
    let itemsObject = {};
    cart.forEach(it => {
        // 把 菜名/饮料名 + 规格(少糖/外带等) 组合在一起
        const fullName = `${it.name}${it.displayMods}`;
        // 累加数量
        itemsObject[fullName] = (itemsObject[fullName] || 0) + it.qty;
    });

    const priceVal = document.getElementById('totalPriceDisplay').innerText.replace('RM ','');

    try {
        // --- 3. 发送到 Firebase ---
        await addDoc(collection(db, "orders"), { 
            table: t, 
            displayStr: ds,       // 供员工端历史记录显示
            items: itemsObject,   // ⚠️ 关键：供厨房系统显示每一行菜品
            totalPrice: priceVal, 
            status: 'pending', 
            // 如果备注里有“外带”，自动设置类型
            type: ds.includes("外带") || ds.includes("Takeaway") ? "takeaway" : "dinein",
            createdAt: serverTimestamp() 
        }); 

        // 成功后的本地处理
        const localOrder = { 
            id: Date.now().toString(), 
            table: t, 
            displayStr: ds, 
            totalPrice: priceVal, 
            status: 'pending', 
            createdAt: new Date().toISOString() 
        };
        ordersData.unshift(localOrder); 
        saveLocalOrders(ordersData);
        
        window.showPop(I18N[currentLang].pop_sent, null, true); 
        cart = []; 
        renderCart(); 
        document.getElementById('tableNum').value = ''; 
        renderHistory();
        
    } catch (e) {
        console.error("发送失败: ", e);
        alert("发送失败，请检查网络");
    }
};