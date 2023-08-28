import { BFF_PREFIX, CBPAAS_PREFIX } from './config';
import { CommerbleAccount, CommerbleAddress, CommerbleCartInRequest, CommerbleCartItems, CommerbleCartLine, CommerbleErrorConflict, CommerbleMemberAccount, CommerbleMemberAccountAddressConfirm, CommerbleMemberAccountConfirm, CommerbleMemberAddress, CommerbleMemberAddressList, CommerbleMemberFavorite, CommerbleMemberFavoriteAppend, CommerbleMemberFavoriteList, CommerbleMemberIndex, CommerbleMemberNotice, CommerbleMemberNoticeAppend, CommerbleMemberNoticeList, CommerbleMemberPoint, CommerbleMemberQuit, CommerbleMemberUserNameConfirm, CommerbleNextType, CommerbleOrderCart, CommerbleOrderHistory, CommerbleOrderHistoryCancel, CommerbleOrderHistoryCustomer, CommerbleOrderHistoryCustomerForm, CommerbleOrderHistoryDelivery, CommerbleOrderHistoryDeliveryForm, CommerbleOrderHistoryList, CommerbleOrderHistoryPayment, CommerbleOrderHistoryPaymentForm, CommerbleOrderHistoryShipping, CommerbleOrderHistoryShippingForm, CommerblePurchaseCallback, CommerblePurchaseComplete, CommerblePurchaseConfirm, CommerblePurchaseError, CommerblePurchaseExternal, CommerblePurchasePayment, CommerblePurchaseShipping, CommerbleResult, CommerbleSiteAccount, CommerbleSiteAccountComplete, CommerbleSiteAccountConfirm, CommerbleSiteActivate, CommerbleSiteActivateRequest, CommerbleSiteGuestOrder, CommerbleSiteLogin, CommerbleSiteRecovery, CommerbleSiteRecoveryUpdate, CommerbleZipAddress } from './types';

const okAsJson = (res: Response) => res.status === 200 && res.headers.get('Content-Type').startsWith('application/json');
const redirect = (res: Response) => res.status === 202 && res.headers.has('Location');
const enc = (text:string):string => encodeURIComponent(text);
const nexts = {
    'site/login': /site\/login$/i,
    'site/accountcomplete': /site\/accountcomplete$/i,
    'site/recoverycomplete': /site\/recoverycomplete$/i,
    'purchase/shipping': /purchase\/\d+\/shipping$/i,
    'purchase/payment': /purchase\/\d+\/payment$/i,
    'purchase/confirm': /purchase\/\d+\/confirm$/i,
    'purchase/external': /purchase\/\d+\/external\/\d+$/i,
    'purchase/complete': /purchase\/\d+\/complete\/\d+$/i,
    'order/cart': /order\/cart/i,
    'order/history': /order\/history\/\d+$/i,
    'order/historylist': /order\/history$/i,
    'member/index': /member\/index$/i,
    'member/account': /member\/account$/i,
    'member/address': /member\/addresses\/\d+$/i,
    'member/addresslist': /member\/addresses$/i,
    'member/favorite': /member\/favorites\/\d+$/i,
    'member/favoritelist': /member\/favorites$/i,
    'member/notice': /member\/notices\/\d+$/i,
    'member/noticelist': /member\/notices$/i,
}

const SetFormData = (data: FormData, obj: object, prefix?: string) => {
    for (const [key, value] of Object.entries(obj||{}).filter(([,value])=>value!==undefined)) {
        if (typeof value === 'object') {
            SetFormData(data, value, [prefix, key+'.'].filter(k => k).join('.'));
        }
        else {
            data.append((prefix||'') + key, value);
        }
    }
}
function _handleRedirectImpl<TNext extends CommerbleNextType>(res: Response, defaultNext?: CommerbleResult<TNext>['next']): CommerbleResult<TNext> {
    const location = res.headers.get('Location');
    let path = new URL(location, window.location as unknown as URL).pathname;
    if (path.startsWith(BFF_PREFIX+'/')) {
        path = path.substring(BFF_PREFIX.length+1).toLocaleLowerCase();
    }
    let next: CommerbleResult<TNext>['next'] = null;
    for (const [code, r] of Object.entries(nexts)) {
        if (r.test(path)) {
            next = code as CommerbleResult<TNext>['next'];
            break;
        }
    }
    if (!next) {
        if (!defaultNext) {
            throw new Error('not supported');
        }
        next = defaultNext;
    }
    return {
        type: 'next',
        next: next,
        raw: path,
    };
}
export class ApiError extends Error {
    static {
      this.prototype.name = 'ApiError'
    }
    constructor(message: string, options?: ErrorOptions) {
      super(message, options);
    }
}
function _handleRedirect<TNext extends CommerbleNextType>(res: Response, defaultNext?: CommerbleResult<TNext>['next']): CommerbleResult<TNext> {
    if (redirect(res)) {
        return _handleRedirectImpl(res, defaultNext);
    }
    throw new ApiError(String(res.status));
}
async function _handleResponse<T,TNext extends CommerbleNextType>(res: Response, defaultNext?: CommerbleResult<TNext>['next']): Promise<T|CommerbleResult<TNext>> {
    if (okAsJson(res)) {
        return await res.json();
    }
    if (redirect(res)) {
        return _handleRedirectImpl(res, defaultNext);
    }
    throw new ApiError(String(res.status));
}

async function _handleJson<T>(res: Response): Promise<T> {
    if (okAsJson(res)) {
        return await res.json();
    }
    throw new Error('not supported');
}
async function _getCarts(url: string): Promise<CommerbleOrderCart> {
    return await _handleJson(await fetch(url));
}

export function getOrderCart(): Promise<CommerbleOrderCart> {
    return _getCarts(BFF_PREFIX + '/order/cart');
}

export function appendLines(lines: CommerbleCartInRequest): Promise<CommerbleOrderCart> {
    const query = lines.map(({item, qty, desc, reserve}) => `item=${item}&qty=${qty}&desc=${enc(desc)||''}&reserve=${reserve||0}`).join('&');
    return _getCarts(BFF_PREFIX + '/order/cart?' + query);
};

export async function removeLine(target: CommerbleCartLine): Promise<CommerbleOrderCart> {
    const body = new FormData();
    body.append('X-HTTP-Method-Override', 'delete');
    body.append('item', target.productId.toString());
    body.append('itemdelete', 'itemdelete');
    const res = await fetch(BFF_PREFIX + '/order/cart', {
        method: 'post',
        body
    });
    return await _handleJson(res);
};

export async function updateQty(cart: CommerbleCartItems, target: CommerbleCartLine, diff: number): Promise<CommerbleOrderCart> {
    const body = new FormData();
    body.append('CartId', String(cart.id));
    body.append('recalc', 'recalc');
    cart.items.forEach((item,i) => {
        body.append(`Items[${i}].ProductId`, String(item.productId));
        body.append(`Items[${i}].RequestAmount`, String(item.requestAmount + (item == target ? diff : 0)));
    })
    const res = await fetch(BFF_PREFIX + '/order/cart', {
        method: 'post',
        body
    });
    return await _handleJson(res);
};

export async function replaceCart(cart: CommerbleCartItems): Promise<CommerbleOrderCart> {
    const body = new FormData();
    body.append('CartId', String(cart.id));
    body.append('clear', 'clear');
    const query = cart.items.map(({productId, requestAmount, description, reserveRequestId}) => `item=${productId}&qty=${requestAmount}&desc=${description||''}&reserve=${reserveRequestId||0}`).join('&');
    const res = await fetch(BFF_PREFIX + '/order/cart?returnUrl=' + enc(BFF_PREFIX + '/order/cart?' + query), {
        method: 'post',
        body
    });
    return await _handleJson(res);
}

export async function checkout(cartId: number) : Promise<CommerbleResult<'site/login'|'purchase/shipping'|'purchase/confirm'>|CommerblePurchaseError> {
    const res = await fetch(BFF_PREFIX + '/purchase/'+cartId);
    return await _handleResponse<CommerblePurchaseError, 'site/login'|'purchase/shipping'|'purchase/confirm'>(res);
}

export async function checkoutAsGuest(cartId: number) : Promise<CommerbleResult<'purchase/shipping'>|CommerblePurchaseError> {
    const res = await fetch(BFF_PREFIX + `/site/newguest/?returnUrl=${enc(`${CBPAAS_PREFIX}/purchase/${cartId}`)}`)
    return await _handleResponse(res);
}

export async function searchAddress(zipcode: string): Promise<CommerbleZipAddress[]> {
    return await _handleJson(await fetch(BFF_PREFIX + `/site/zipcode/${zipcode}`));
}

export async function getPurchaseShipping(cartId: number): Promise<CommerblePurchaseShipping|CommerbleResult<'site/login'>> {
    return await _handleResponse(await fetch(`/api/ec/purchase/${cartId}/shipping`));
}

export async function postPurchaseShipping(cartId:number, form: CommerblePurchaseShipping): Promise<CommerblePurchaseShipping|CommerbleResult<'site/login'|'purchase/payment'>> {
    const body = new FormData();
    SetFormData(body, form);
    body.append('next', 'next');
    const res = await fetch(BFF_PREFIX + `/purchase/${cartId}/shipping`, {
        method: 'post',
        body
    });
    return await _handleResponse(res);
}

export async function getPurchasePayment(cartId: number): Promise<CommerblePurchasePayment|CommerbleResult<'site/login'>> {
    return await _handleJson(await fetch(BFF_PREFIX + `/purchase/${cartId}/payment`));
}

export async function postPurchasePayment(cartId:number, form: CommerblePurchasePayment): Promise<CommerblePurchasePayment|CommerbleResult<'site/login'|'purchase/confirm'>> {
    const body = new FormData();
    SetFormData(body, form);
    body.append('next', 'next');
    const res = await fetch(BFF_PREFIX + `/purchase/${cartId}/payment`, {
        method: 'post',
        body
    });
    return await _handleResponse(res);
}

export async function getPurchaseConfirm(cartId: number): Promise<CommerblePurchaseConfirm|CommerbleResult<'site/login'>> {
    return await _handleResponse(await fetch(BFF_PREFIX + `/purchase/${cartId}/confirm`));
}

export async function purchase(cartId: number, token: string): Promise<CommerblePurchaseError|CommerbleResult<'site/login'|'purchase/external'|'purchase/complete'>> {
    const body = new FormData();
    body.append('__RequestVerificationToken', token)
    const res = await fetch(BFF_PREFIX + `/purchase/${cartId}`, {
        method: 'post',
        body
    });
    return await _handleResponse(res);
}

export async function getPurchaseComplete(cartId: number, orderId: number): Promise<CommerblePurchaseComplete|CommerbleResult<'site/login'>> {
    return await _handleResponse(await fetch(BFF_PREFIX + `/purchase/${cartId}/complete/${orderId}`));
}

export async function getPurchaseExternal (cartId: number, orderId: number): Promise<CommerblePurchaseExternal|CommerbleResult<'site/login'|'purchase/complete'|'purchase/callback'>> {
    return await _handleResponse(await fetch(BFF_PREFIX + `/purchase/${cartId}/external/${orderId}`));
}

export async function getSiteLogin (returnUrl?: string): Promise<CommerbleSiteLogin> {
    const query = returnUrl ? `?returnUrl=${enc(returnUrl)}` : '';
    return await _handleJson(await fetch(BFF_PREFIX + `/site/login${query}`));
}

export async function login(form: CommerbleSiteLogin, returnUrl: string): Promise<CommerbleSiteLogin|CommerbleResult<'self'>> {
    const body = new FormData();
    body.append('__RequestVerificationToken', form.token);
    body.append('UserName', form.userName);
    body.append('Password', form.password);
    body.append('ReturnUrl', CBPAAS_PREFIX + (returnUrl?.startsWith(BFF_PREFIX) ? returnUrl.substring(BFF_PREFIX.length) : '/site/loginstate'));
    const res = await fetch(BFF_PREFIX + `/site/login`, {
        method: 'post',
        body
    });
    return await _handleResponse<CommerbleSiteLogin, 'self'>(res, 'self');
}

export async function logout(returnUrl: string): Promise<void> {
    window.location.href = BFF_PREFIX + `/site/logout?returnUrl=${enc(returnUrl)}`;
}

export async function getMemberIndex(): Promise<CommerbleMemberIndex|CommerbleResult<'site/login'>> {
    return await _handleResponse<CommerbleMemberIndex, 'site/login'>(await fetch(BFF_PREFIX + `/member/index`, {credentials:'include'}));
}

export async function getMemberPoint(): Promise<CommerbleMemberPoint|CommerbleResult<'site/login'>> {
    return await _handleJson(await fetch(BFF_PREFIX + `/member/point`));
}

export async function getMemberQuit(): Promise<CommerbleMemberQuit|CommerbleResult<'site/login'>> {
    return await _handleJson(await fetch(BFF_PREFIX + `/member/quit`));
}

export async function postMemberQuit(accept: boolean, token: string): Promise<CommerbleMemberQuit|CommerbleResult<'site/login'|'self'>> {
    const body = new FormData();
    body.append('Accept', accept.toString())
    body.append('__RequestVerificationToken', token)
    const res = await fetch(BFF_PREFIX + `/member/quit`, {
        method: 'post',
        body
    });
    return await _handleResponse(res);
}

export async function getMemberAccount(): Promise<CommerbleMemberAccount|CommerbleResult<'site/login'>> {
    return await _handleResponse(await fetch(BFF_PREFIX + `/member/account`));
}

async function confirmMemberAccount(form: Omit<CommerbleAccount, 'userNo'|'userName'|'birthday'>): Promise<CommerbleMemberAccount|CommerbleMemberAccountConfirm|CommerbleResult<'site/login'>> {
    const body = new FormData();
    body.append('LastName', form.lastName);
    body.append('FirstName', form.firstName);
    body.append('LastNameKana', form.lastNameKana);
    body.append('FirstNameKana', form.firstNameKana);
    body.append('BirthdayY', form.birthdayY.toString());
    body.append('BirthdayM', form.birthdayM.toString());
    body.append('BirthdayD', form.birthdayD.toString());
    body.append('Sex', form.sex);
    body.append('Subscribe', form.subscribe?.toString());
    body.append('confirm', 'confirm');
    const res = await fetch(BFF_PREFIX + `/member/account`, {
        method: 'post',
        body
    });
    return await _handleJson(res);
}

export async function updateMemberAccount(form: Omit<CommerbleAccount, 'userNo'|'userName'|'birthday'>): Promise<CommerbleMemberAccount|CommerbleResult<'site/login'|'member/index'>> {
    const confirm = await confirmMemberAccount(form);
    if (confirm.type === 'next') {
        return confirm;
    }
    if (confirm.type === 'member/account') {
        return confirm;
    }
    const body = new FormData();
    body.append('model', confirm.model);
    body.append('__RequestVerificationToken', confirm.token)
    body.append('update', 'update');
    const res = await fetch(BFF_PREFIX + `/member/account`, {
        method: 'post',
        body
    });
    
    const update = await _handleRedirect<'site/login'|'member/index'|'member/account'>(res);

    if (update.next === 'member/account') {
        return await getMemberAccount();
    }

    return update as CommerbleResult<'site/login'|'member/index'>;
}

async function confirmMemberAccountAddress(form: Omit<CommerbleAddress, 'addressId'|'recipientlastname'|'recipientfirstname'|'recipientlastnamekana'|'recipientfirstnamekana'>): Promise<CommerbleMemberAccountAddressConfirm|CommerbleResult<'site/login'|'member/account'>> {
    const body = new FormData();
    body.append('Address.ZipCode', form.zipCode);
    body.append('Address.Pref', form.pref);
    body.append('Address.City', form.city);
    body.append('Address.Street', form.street);
    body.append('Address.Building', form.building);
    body.append('Address.Tel', form.tel);
    body.append('confirm', 'confirm');
    const res = await fetch(BFF_PREFIX + `/member/accountaddress`, {
        method: 'post',
        body
    });
    return await _handleJson(res);
}

export async function updateMemberAccountAddress(form: Omit<CommerbleAddress, 'addressId'|'recipientlastname'|'recipientfirstname'|'recipientlastnamekana'|'recipientfirstnamekana'>): Promise<CommerbleMemberAccount|CommerbleResult<'site/login'|'member/index'>> {
    const confirm = await confirmMemberAccountAddress(form);
    if (confirm.type === 'next') {
        if (confirm.next === 'member/account') {
            return await getMemberAccount();
        }
        if (confirm.next === 'site/login') {
            return confirm as CommerbleResult<'site/login'>;
        }
        throw new Error('not supported');
    }

    const body = new FormData();
    body.append('model', confirm.model);
    body.append('__RequestVerificationToken', confirm.token)
    body.append('update', 'update');
    const res = await fetch(BFF_PREFIX + `/member/accountaddress`, {
        method: 'post',
        body
    });

    const update = await _handleRedirect<'site/login'|'member/index'|'member/account'>(res);

    if (update.next === 'member/account') {
        return await getMemberAccount();
    }

    return update as CommerbleResult<'site/login'|'member/index'>;
}

async function confirmMemberUserName(form: { userName: string }): Promise<CommerbleMemberUserNameConfirm|CommerbleResult<'site/login'|'member/account'>> {
    const body = new FormData();
    body.append('UserName', form.userName);
    body.append('confirm', 'confirm');
    const res = await fetch(BFF_PREFIX + `/member/username`, {
        method: 'post',
        body
    });
    return await _handleJson(res);
}

export async function updateMemberUserName(form: { userName: string }): Promise<CommerbleMemberAccount|CommerbleResult<'site/login'|'member/index'>> {
    const confirm = await confirmMemberUserName(form);
    if (confirm.type === 'next') {
        if (confirm.next === 'member/account') {
            return await getMemberAccount();
        }
        if (confirm.next === 'site/login') {
            return confirm as CommerbleResult<'site/login'>;
        }
        throw new Error('not supported');
    }

    const body = new FormData();
    body.append('model', confirm.model);
    body.append('__RequestVerificationToken', confirm.token)
    body.append('update', 'update');
    const res = await fetch(BFF_PREFIX + `/member/username`, {
        method: 'post',
        body
    });

    const update = await _handleRedirect<'site/login'|'member/index'|'member/account'>(res);

    if (update.next === 'member/account') {
        return await getMemberAccount();
    }

    return update as CommerbleResult<'site/login'|'member/index'>;
}

export async function getOrderHistoryList(page?: number): Promise<CommerbleOrderHistoryList|CommerbleResult<'site/login'>> {
    return await _handleResponse(await fetch(BFF_PREFIX + `/order/history?page=${page??0}`));
}

export async function getOrderHistory(orderId: number): Promise<CommerbleOrderHistory|CommerbleResult<'site/login'>> {
    return await _handleResponse(await fetch(BFF_PREFIX + `/order/history/${orderId}`));
}

export async function cancelOrder(orderId: number, token: string): Promise<CommerbleOrderHistory|CommerbleResult<'site/login'|'order/historylist'>> {
    const body = new FormData();
    body.append('X-HTTP-Method-Override', 'delete');
    body.append('__RequestVerificationToken', token)
    body.append('commit', 'commit');
    const res = await fetch(BFF_PREFIX + `/order/history/${orderId}`, {
        method: 'post',
        body
    });

    const cancel = await _handleResponse<CommerbleOrderHistoryCancel,'site/login'|'order/historylist'>(res);

    if (cancel.type === 'order/historycancel') {
        return {
            ...cancel,
            type: 'order/history',
        }
    }

    return cancel;
}

export async function modifyCustomer(form: CommerbleOrderHistoryCustomerForm): Promise<CommerbleOrderHistoryCustomer|CommerbleResult<'site/login'|'order/history'>> {
    const body = new FormData();
    body.append('X-HTTP-Method-Override', 'put');
    body.append('customer', 'customer');
    body.append('OrderCustomer.EmailAddr', form.orderCustomer.emailAddr||null);
    for (const [key, value] of Object.entries(form.serviceValues ?? {})) {
        body.append(`ServiceValues[${key}]`, value);
    }
    const res = await fetch(BFF_PREFIX + `/order/history/${form.id}?__proxybypass=1`, {
        method: 'post',
        body
    });

    return await _handleResponse<CommerbleOrderHistoryCustomer,'site/login'|'order/history'>(res);
}

export async function modifyShipping(form: CommerbleOrderHistoryShippingForm): Promise<CommerbleOrderHistoryShipping|CommerbleResult<'site/login'|'order/history'>> {
    const body = new FormData();
    body.append('X-HTTP-Method-Override', 'put');
    body.append('shipping', 'shipping');
    body.append('DeliveryOrderAddress.recipientlastname', form.deliveryOrderAddress.recipientlastname);
    body.append('DeliveryOrderAddress.recipientfirstname', form.deliveryOrderAddress.recipientfirstname);
    body.append('DeliveryOrderAddress.recipientlastnamekana', form.deliveryOrderAddress.recipientlastnamekana);
    body.append('DeliveryOrderAddress.recipientlastnamekana', form.deliveryOrderAddress.recipientlastnamekana);
    body.append('DeliveryOrderAddress.zipCode', form.deliveryOrderAddress.zipCode);
    body.append('DeliveryOrderAddress.pref', form.deliveryOrderAddress.pref);
    body.append('DeliveryOrderAddress.city', form.deliveryOrderAddress.city);
    body.append('DeliveryOrderAddress.street', form.deliveryOrderAddress.street||null);
    body.append('DeliveryOrderAddress.building', form.deliveryOrderAddress.building||null);
    body.append('DeliveryOrderAddress.tel', form.deliveryOrderAddress.tel);
    for (const [key, value] of Object.entries(form.serviceValues ?? {})) {
        body.append(`ServiceValues[${key}]`, value);
    }
    const res = await fetch(BFF_PREFIX + `/order/historyshipping/${form.id}`, {
        method: 'post',
        body
    });

    return await _handleResponse<CommerbleOrderHistoryShipping,'site/login'|'order/history'>(res);
}

export async function modifyDelivery(form: CommerbleOrderHistoryDeliveryForm): Promise<CommerbleOrderHistoryDelivery|CommerbleResult<'site/login'|'order/history'>> {
    const body = new FormData();
    body.append('X-HTTP-Method-Override', 'put');
    body.append('delivery', 'delivery');
    body.append('DeliveryOrder.deliveryDate', form.deliveryOrder.deliveryDate||null);
    body.append('DeliveryOrder.hourRange', form.deliveryOrder.hourRange||null);
    body.append('DeliveryOrder.wrappingType', form.deliveryOrder.wrappingType?.toString()||null);
    body.append('DeliveryOrder.senderName', form.deliveryOrder.senderName||null);
    const res = await fetch(BFF_PREFIX + `/order/history/${form.id}?__proxybypass=1`, {
        method: 'post',
        body
    });

    return await _handleResponse<CommerbleOrderHistoryDelivery,'site/login'|'order/history'>(res);
}

export async function modifyPayment(form: CommerbleOrderHistoryPaymentForm): Promise<CommerbleOrderHistoryPayment|CommerbleResult<'site/login'|'order/history'>> {
    const body = new FormData();
    body.append('X-HTTP-Method-Override', 'put');
    body.append('payment', 'payment');
    body.append('PaymentMethod', form.paymentMethod);
    body.append('OrderCustomer.PaymentDetail', form.orderCustomer.paymentDetail||null);
    if (form.orderCustomer.numberOfPayments) {
        body.append('OrderCustomer.NumberOfPayments', form.orderCustomer.numberOfPayments);
    }

    const res = await fetch(BFF_PREFIX + `/order/history/${form.id}?__proxybypass=1`, {
        method: 'post',
        body
    });

    return await _handleResponse<CommerbleOrderHistoryPayment,'site/login'|'order/history'>(res);
}

export async function commitChanges(orderId: number, token:string): Promise<CommerbleOrderHistory|CommerbleResult<'site/login'|'order/history'|'order/historylist'|'purchase/external'>> {
    const body = new FormData();
    body.append('X-HTTP-Method-Override', 'put');
    body.append('__RequestVerificationToken', token);   
    body.append('commit', 'commit');

    const res = await fetch(BFF_PREFIX + `/order/history/${orderId}`, {
        method: 'post',
        body
    });

    return await _handleResponse(res);
}

export async function getMemberAddressList(page?: number): Promise<CommerbleMemberAddressList|CommerbleResult<'site/login'>> {
    return await _handleResponse(await fetch(BFF_PREFIX + `/member/addresses?page=${page??0}`));
}

export async function getMemberAddress(addressId: number): Promise<CommerbleMemberAddress|CommerbleResult<'site/login'>> {
    return await _handleJson(await fetch(BFF_PREFIX + `/member/addresses/${addressId}`));
}


export async function getMemberCreateAddress(): Promise<CommerbleMemberAddress|CommerbleResult<'site/login'>> {
    return await _handleJson(await fetch(BFF_PREFIX + `/member/createaddress`));
}

export async function createMemberAddress(form: CommerbleAddress, token: string): Promise<CommerbleMemberAddress|CommerbleResult<'site/login'|'member/addresslist'>> {
    const body = new FormData();
    body.append('AddressName', form.addressName);
    body.append('Address.Recipientlastname', form.recipientlastname);
    body.append('Address.Recipientfirstname', form.recipientfirstname);
    body.append('Address.Recipientlastnamekana', form.recipientlastnamekana);
    body.append('Address.Recipientfirstnamekana', form.recipientfirstnamekana);
    body.append('Address.ZipCode', form.zipCode);
    body.append('Address.Pref', form.pref);
    body.append('Address.City', form.city);
    body.append('Address.Street', form.street);
    body.append('Address.Building', form.building);
    body.append('Address.Tel', form.tel);
    body.append('__RequestVerificationToken', token)
    body.append('create', 'create');
    const res = await fetch(BFF_PREFIX + `/member/createaddress`, {
        method: 'post',
        body
    });
    return await _handleResponse(res);
}

export async function updateMemberAddress(form: CommerbleAddress, token: string): Promise<CommerbleMemberAddress|CommerbleResult<'site/login'|'member/addresslist'>> {
    const body = new FormData();
    body.append('AddressId', form.addressId.toString());
    body.append('AddressName', form.addressName);
    body.append('Address.Recipientlastname', form.recipientlastname);
    body.append('Address.Recipientfirstname', form.recipientfirstname);
    body.append('Address.Recipientlastnamekana', form.recipientlastnamekana);
    body.append('Address.Recipientfirstnamekana', form.recipientfirstnamekana);
    body.append('Address.ZipCode', form.zipCode);
    body.append('Address.Pref', form.pref);
    body.append('Address.City', form.city);
    body.append('Address.Street', form.street);
    body.append('Building', form.building);
    body.append('__RequestVerificationToken', token)
    body.append('update', 'update');
    const res = await fetch(BFF_PREFIX + `/member/addresses/${form.addressId}`, {
        method: 'post',
        body
    });
    return await _handleResponse(res);
}

export async function deleteMemberAddress(form: CommerbleAddress, token: string): Promise<CommerbleResult<'site/login'|'member/addresslist'>> {
    const body = new FormData();
    body.append('AddressId', form.addressId.toString());
    body.append('__RequestVerificationToken', token)
    body.append('delete', 'delete');
    const res = await fetch(BFF_PREFIX + `/member/addresses/${form.addressId}`, {
        method: 'post',
        body
    });
    return await _handleRedirect(res);
}

export async function getMemberFavoriteList(page?: number): Promise<CommerbleMemberFavoriteList|CommerbleResult<'site/login'>> {
    return await _handleResponse(await fetch(BFF_PREFIX + `/member/favorites?page=${page??0}`));
}

export async function getMemberFavorite(productId: number): Promise<CommerbleMemberFavorite|CommerbleResult<'site/login'>> {
    return await _handleResponse(await fetch(BFF_PREFIX + `/member/favorites/${productId}`));
}

export async function deleteMemberFavorite(productId: number, token: string): Promise<CommerbleResult<'site/login'|'member/favoritelist'>> {
    const body = new FormData();
    body.append('X-HTTP-Method-Override', 'delete');
    body.append('__RequestVerificationToken', token);
    const res = await fetch(BFF_PREFIX + `/member/favorites/${productId}`, {
        method: 'post',
        body
    });
    return await _handleRedirect(res);
}

export async function createMemberFavorite(productId: number): Promise<CommerbleResult<'site/login'|'member/favoritelist'>|CommerbleErrorConflict> {
    try {
        let res = await fetch(BFF_PREFIX + `/member/createfavorite?item=${productId}`);
        let result = await _handleResponse<CommerbleMemberFavoriteAppend, 'site/login'>(res);
        if (result.type === 'next') {
            return result;
        }
        const body = new FormData();
        body.append('__RequestVerificationToken', result.token);
        res = await fetch(BFF_PREFIX + `/member/favorites?item=${productId}`, {
            method: 'post',
            body
        });
        return _handleRedirect(res);
    } 
    catch (err) {
        if (err instanceof ApiError && err.message === '409') {
            return { type: 'error/conflict' };
        }
        throw err;
    }
}

export async function getMemberNoticeList(page?: number): Promise<CommerbleMemberNoticeList|CommerbleResult<'site/login'>> {
    return await _handleResponse(await fetch(BFF_PREFIX + `/member/notices?page=${page??0}`));
}

export async function getMemberNotice(reserveId: number): Promise<CommerbleMemberNotice|CommerbleResult<'site/login'>> {
    return await _handleResponse(await fetch(BFF_PREFIX + `/member/notices/${reserveId}`));
}

export async function deleteMemberNotice(reserveId: number, token: string): Promise<CommerbleResult<'site/login'|'member/noticelist'>> {
    const body = new FormData();
    body.append('X-HTTP-Method-Override', 'delete');
    body.append('__RequestVerificationToken', token);
    const res = await fetch(BFF_PREFIX + `/member/notices/${reserveId}`, {
        method: 'post',
        body
    });
    return await _handleRedirect(res);
}

export async function createMemberNotice(productId: number, qty: number): Promise<CommerbleResult<'site/login'|'member/noticelist'>|CommerbleErrorConflict> {
    try {
        let res = await fetch(BFF_PREFIX + `/member/createnotice?item=${productId}&qty=${qty}`);
        let result = await _handleResponse<CommerbleMemberNoticeAppend, 'site/login'>(res);
        if (result.type === 'next') {
            return result;
        }
        const body = new FormData();
        body.append('__RequestVerificationToken', result.token);
        body.append('RequestAmount', qty.toString());
        body.append('commit', 'commit');
        res = await fetch(BFF_PREFIX + `/member/createnotice?item=${productId}`, {
            method: 'post',
            body
        });
        return _handleRedirect(res);
    } 
    catch (err) {
        if (err instanceof ApiError && err.message === '409') {
            return { type: 'error/conflict' };
        }
        throw err;
    }
}

export async function getSiteAccount(): Promise<CommerbleSiteAccount> {
    return await _handleJson(await fetch(BFF_PREFIX + `/site/account`));
}

export async function registerAccount(form: CommerbleSiteAccount): Promise<CommerbleResult<'site/accountcomplete'>|CommerbleSiteAccount> {
    let body = new FormData();
    body.append('userName', form.userName);
    body.append('password', form.password);
    body.append('confirmPassword', form.confirmPassword);
    body.append('lastName', form.lastName);
    body.append('firstName', form.firstName);
    body.append('lastNameKana', form.lastNameKana);
    body.append('firstNameKana', form.firstNameKana);
    body.append('birthdayY', form.birthdayY.toString());
    body.append('birthdayM', form.birthdayM.toString());
    body.append('birthdayD', form.birthdayD.toString());
    body.append('sex', form.sex);
    body.append('subscribe', form.subscribe?.toString());
    body.append('__RequestVerificationToken', form.token);
    body.append('confirm', 'confirm');
    let res = await fetch(BFF_PREFIX + `/site/account`, {
        method: 'post',
        body
    });
    const confirm = await _handleJson<CommerbleSiteAccount|CommerbleSiteAccountConfirm>(res);
    if (confirm.type === 'site/account') {
        return confirm;
    }
    body = new FormData();
    body.append('model', confirm.model);
    body.append('__RequestVerificationToken', confirm.token);
    body.append('create', 'create');
    res = await fetch(BFF_PREFIX + `/site/account`, {
        method: 'post',
        body
    });
    const result = await _handleResponse<CommerbleSiteAccount,'site/accountcomplete'>(res);

    if (result.type === 'next' && result.next === 'site/accountcomplete') {
        await fetch(BFF_PREFIX + `/site/accountcomplete`);
    }

    return result;
}

export async function getSiteActivate(token: string): Promise<CommerbleSiteActivate> {
    return await _handleJson(await fetch(BFF_PREFIX + `/site/activate/${token}`));
}

export async function getSiteActivateRequest(): Promise<CommerbleSiteActivateRequest> {
    return await _handleJson(await fetch(BFF_PREFIX + `/site/activate`));
}

export async function requestActivation(form: {userName: string}, token: string): Promise<CommerbleSiteActivateRequest> {
    const body = new FormData();
    body.append('userName', form.userName);
    body.append('__RequestVerificationToken', token);
    body.append('request', 'request');
    await fetch(BFF_PREFIX + `/site/activate`, {
        method: 'post',
        body
    });
    return await getSiteActivateRequest();
}

export async function getSiteRecovery(): Promise<CommerbleSiteRecovery> {
    return await _handleJson(await fetch(BFF_PREFIX + `/site/recovery`));
}

export async function getSiteRecoveryUpdate(token: string): Promise<CommerbleSiteRecoveryUpdate> {
    return await _handleJson(await fetch(BFF_PREFIX + `/site/recovery/${token}`));
}

export async function requestRecovery(form: { userName: string }, token: string): Promise<CommerbleSiteRecovery> {
    const body = new FormData();
    body.append('userName', form.userName);
    body.append('__RequestVerificationToken', token);
    body.append('request', 'request');
    await fetch(BFF_PREFIX + `/site/recovery`, {
        method: 'post',
        body
    });
    return await getSiteRecovery();
}

export async function recoveryPassword(form: Pick<CommerbleSiteAccount, 'password'|'confirmPassword'> & Pick<CommerbleSiteRecoveryUpdate, 'token'>, token: string): Promise<CommerbleResult<'site/recoverycomplete'>|CommerbleSiteRecoveryUpdate> {
    const body = new FormData();
    body.append('password', form.password);
    body.append('confirmPassword', form.confirmPassword);
    body.append('__RequestVerificationToken', token);
    body.append('update', 'update');
    const res = await fetch(BFF_PREFIX + `/site/recovery/${form.token}`, {
        method: 'post',
        body
    });
    const result = await _handleRedirect<'site/recovery'|'site/recoverycomplete'>(res);
    if (result.type === 'next' && result.next === 'site/recovery') {
        return await getSiteRecoveryUpdate(form.token);
    }

    return result as CommerbleResult<'site/recoverycomplete'>;
}

export async function getSiteGuestOrder(token: string): Promise<CommerbleSiteGuestOrder> {
    return await _handleJson(await fetch(BFF_PREFIX + `/site/guestorder/${token}`));
}

export async function loginGuest(form: {authCode: string, token: string}, token: string): Promise<CommerbleResult<'order/history'>|CommerbleSiteGuestOrder> {
    const body = new FormData();
    body.append('authCode', form.authCode);
    body.append('__RequestVerificationToken', token);
    const res = await fetch(BFF_PREFIX + `/site/guestorder/${form.token}`, {
        method: 'post',
        body
    });
    return await _handleResponse(res);
}