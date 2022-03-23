function Promise(executor) {
  //添加必要属性
  this.PromiseState = 'pending';
  this.PromiseResult = null;
  this.callback = [];
  //保存实例对象的this值，否则在调用resolve和reject的时候，this为windows
  const self = this;
  function resolve(data) {
    //保证promise的状态只能改变一次
    if (self.PromiseState !== 'pending') return;
    //1.修改对象的状态
    self.PromiseState = 'fulfilled';
    //2.修改对象结果值
    self.PromiseResult = data;
    self.callback.forEach((item) => {
      item.onResolved(data);
    });
  }
  function reject(data) {
    if (self.PromiseState !== 'pending') return;
    self.PromiseState = 'rejected';
    self.PromiseResult = data;
    self.callback.forEach((item) => {
      item.onRejected(data);
    });
  }
  //try catch 可以保证执行器在抛出异常的时候可以执行reject函数，而不是把异常抛到最外面
  try {
    executor(resolve, reject);
  } catch (e) {
    reject(e);
  }
}

Promise.prototype.then = function (onResolved, onRejected) {
  return new Promise((resolve, reject) => {
    //在这里可以用this，因为then方法都是通过实例调用的
    if (this.PromiseState === 'fulfilled') {
      try {
        //获取一下传入回调函数的结果
        const result = onResolved(this.PromiseState);
        //回调函数返回一个Promise，那么这个Promise的结果就是then的结果
        if (typeof result === Promise) {
          result.then(
            (v) => {
              resolve(v);
            },
            (r) => {
              reject(r);
            }
          );
        } else {
          //如果不是一个Promise那么直接返回这个值即可
          resolve(result);
        }
        onResolved(this.PromiseResult);
      } catch (e) {
        reject(e);
      }
    }
    if (this.PromiseState === 'rejected') {
      onRejected(this.PromiseResult);
    }
    if (this.PromiseState === 'pending') {
      this.callback.push({
        onResolved,
        onRejected,
      });
    }
  });
};
